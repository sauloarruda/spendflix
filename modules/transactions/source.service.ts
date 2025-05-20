import { Source, SourceStatus, SourceType } from '@/prisma';
import Papa from 'papaparse';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';
import s3Service from '@/common/s3';

const logger = getLogger().child({ module: 'sources' });

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

function sourceS3Key(source: Source) {
  return [source.id, 'csv'].join('.');
}

// eslint-disable-next-line max-lines-per-function
async function putSourceFile(accountId: string, file: File) {
  logger.debug({ accountId, file }, 'putSourceFile');
  const fileBuffer = await file.arrayBuffer();
  const fileContent = Buffer.from(fileBuffer).toString('utf8');
  const { headers } = parseCsvFile(fileContent);

  // Detect type from headers
  const validation = validateSourceType(headers);

  if (!validation.valid) {
    throw new Error(validation.message);
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
    },
    'Starting file upload:',
  );

  // Upload to S3
  await s3Service.upload(sourceS3Key(source), file);

  return source;
}

const sourceService = {
  putSourceFile,
  getSourceTypeColumnMapping,
  detectSourceType,
};

export default sourceService;
