/* eslint-disable max-lines */
import fs from 'fs';

import { SourceStatus, SourceType } from '@/prisma';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Papa from 'papaparse';

import getConfig from '@/common/config';
import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

const logger = getLogger().child({ module: 'sources' });

const Bucket = getConfig().S3_BUCKET;
const region = getConfig().S3_REGION;

if (!Bucket) {
  throw new Error('AMPLIFY_BUCKET environment variable is not set');
}

if (!region) {
  throw new Error('AWS_REGION environment variable is not set');
}

// Validate region format
if (!region.match(/^[a-z]{2}-[a-z]+-\d+$/)) {
  throw new Error(
    `Invalid AWS region format: ${region}. Expected format: us-east-1, us-west-2, etc.`,
  );
}

logger.debug(
  {
    bucket: Bucket,
    region,
    hasAccessKey: !!getConfig().S3_KEY,
    hasSecretKey: !!getConfig().S3_REGION,
  },
  'S3 Configuration',
);

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: getConfig().S3_KEY as string,
    secretAccessKey: getConfig().S3_REGION as string,
  },
});

/**
 * Returns the column mapping for different source types
 */
function getSourceTypeColumnMapping() {
  return {
    NUBANK_ACCOUNT_CSV: {
      date: 'Data',
      amount: 'Valor',
      description: 'Descrição',
      invertAmountSignal: false,
    },
    NUBANK_CREDIT_CARD_CSV: {
      date: 'date',
      amount: 'amount',
      description: 'title',
      invertAmountSignal: true,
    },
  };
}

type ColumnMappingType = ReturnType<typeof getSourceTypeColumnMapping>;

/**
 * Detects the type of the CSV file based on its headers
 */
function detectSourceType(headers: string[]): SourceType | null {
  const columnMapping = getSourceTypeColumnMapping();

  // Using Object.keys instead of iterators for linter compliance
  return Object.keys(columnMapping).reduce<SourceType | null>((result, typeKey) => {
    if (result) return result;

    const typeStr = typeKey as keyof ColumnMappingType;
    const mapping = columnMapping[typeStr];
    const requiredColumns = [mapping.date, mapping.amount, mapping.description];

    if (requiredColumns.every((col) => headers.includes(col))) {
      return typeStr as unknown as SourceType;
    }
    return null;
  }, null);
}

/**
 * Reads and parses a CSV file
 */
function parseCsvFile(fileContent: string) {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const data = parsed.data as Record<string, string>[];
  if (data.length === 0) {
    throw new Error('File is empty or has no valid data');
  }

  return {
    headers: Object.keys(data[0]),
    data,
  };
}

/**
 * Creates a source record in the database
 */
async function createSource(accountId: string, type: SourceType) {
  return getPrisma().source.create({
    data: {
      accountId,
      type,
      status: SourceStatus.PENDING,
    },
  });
}

/**
 * Uploads file to S3
 */
async function uploadToS3(
  source: { id: string },
  file: { arrayBuffer: () => Promise<Buffer | ArrayBuffer>; type: string },
) {
  const Body = (await file.arrayBuffer()) as Buffer;
  const command = new PutObjectCommand({
    Bucket,
    Key: [source.id, 'csv'].join('.'),
    Body,
    ContentType: file.type,
  });

  await s3.send(command);
  logger.debug('File uploaded successfully');
}

// Split error handling into smaller functions to comply with max-lines-per-function
function createErrorMessages() {
  return {
    ENOTFOUND: `Bucket not found. Please check if the bucket '${Bucket}' exists in region '${region}'`,
    AccessDenied: 'Access denied. Please check your AWS credentials',
    InvalidAccessKeyId: 'Invalid AWS access key',
    SignatureDoesNotMatch: 'Invalid AWS secret key',
  };
}

function getErrorMessage(err: Error) {
  const errorMessages = createErrorMessages();
  const matchedError = Object.entries(errorMessages).find(([key]) => err.message.includes(key));
  return matchedError ? matchedError[1] : 'Erro ao processar arquivo.';
}

/**
 * Handle errors for source operations
 */
function handleError(error: unknown) {
  logger.error(
    {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucket: Bucket,
      region,
    },
    'Error in source operation:',
  );

  return error instanceof Error ? getErrorMessage(error) : 'Erro ao processar arquivo.';
}

/**
 * Prepare file data for S3 upload
 */
function prepareFileData(fileContent: string) {
  return {
    type: 'text/csv',
    arrayBuffer: async () => Buffer.from(fileContent),
  };
}

/**
 * Check if source type can be determined from headers
 */
function validateSourceType(headers: string[]) {
  const detectedType = detectSourceType(headers);

  if (!detectedType) {
    return {
      valid: false,
      message:
        'Não foi possível determinar o tipo de arquivo. Verifique se o arquivo CSV tem o formato correto.',
      type: null,
    };
  }

  return {
    valid: true,
    message: '',
    type: detectedType,
  };
}

/**
 * Validate account exists
 */
async function validateAccount(accountId: string) {
  const account = await getPrisma().account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return {
      valid: false,
      message: `Conta com ID ${accountId} não encontrada.`,
    };
  }

  return { valid: true, message: '', account };
}

/**
 * Processes a local file path to create a source and upload to S3
 */
// eslint-disable-next-line max-lines-per-function
async function processLocalFile(filePath: string, accountId: string) {
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse CSV and detect type
    const { headers } = parseCsvFile(fileContent);
    const validation = validateSourceType(headers);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Validate account
    const accountValidation = await validateAccount(accountId);
    if (!accountValidation.valid) {
      return {
        success: false,
        message: accountValidation.message,
      };
    }

    // Create source and upload file
    const source = await createSource(accountId, validation.type!);
    logger.debug({ source }, 'Created Source in database');

    const fileData = prepareFileData(fileContent);
    await uploadToS3(source, fileData);

    return {
      success: true,
      message: 'Arquivo enviado com sucesso. Processando transações...',
      source,
    };
  } catch (error) {
    const errorMessage = handleError(error);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// eslint-disable-next-line max-lines-per-function
async function putSourceFile(accountId: string, file: File) {
  try {
    logger.debug({ accountId, file }, 'putSourceFile');
    // Parse CSV from file to detect type
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf8');
    const { headers } = parseCsvFile(fileContent);

    // Detect type from headers
    const validation = validateSourceType(headers);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    logger.debug({ type: validation.type }, 'Detected file type');

    // Create source with detected type
    const source = await createSource(accountId, validation.type!);
    logger.debug({ source }, 'Created Source in database');

    logger.debug(
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        bucket: Bucket,
      },
      'Starting file upload:',
    );

    // Upload to S3
    await uploadToS3(source, file);

    return {
      success: true,
      message: 'Arquivo enviado com sucesso. Processando transações...',
      source,
    };
  } catch (error) {
    const errorMessage = handleError(error);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

const sourceService = {
  putSourceFile,
  processLocalFile,
  getSourceTypeColumnMapping,
  detectSourceType,
};

export default sourceService;
