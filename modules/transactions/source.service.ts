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

function determineSourceType(headers: string[]): SourceType | null {
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

function sourceS3Key(source: Source) {
  return [source.id, 'csv'].join('.');
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

class InvalidSourceTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSourceTypeError';
  }
}

function validateSourceType(headers: string[]) {
  const detectedType = determineSourceType(headers);

  if (!detectedType) {
    throw new InvalidSourceTypeError(`Can't determine type with headers: ${headers.join(',')}`);
  }

  return detectedType;
}

async function detectCsvSourceType(file: File): Promise<SourceType> {
  const fileBuffer = await file.arrayBuffer();
  const fileContent = Buffer.from(fileBuffer).toString('utf8');
  const { headers } = parseCsvFile(fileContent);

  return validateSourceType(headers);
}

async function validateAccountSourceType(
  csvSourceType: SourceType,
  accountId: string,
): Promise<void> {
  const account = await getPrisma().account.findFirstOrThrow({ where: { id: accountId } });
  if (account.sourceType !== csvSourceType) {
    throw new InvalidSourceTypeError(
      `Account sourceType (${account.sourceType}) is incompatible with CSV sourceType (${csvSourceType})`,
    );
  }
}

async function putSourceFile(accountId: string, file: File) {
  logger.debug({ accountId, file }, 'putSourceFile');

  const csvSourceType = await detectCsvSourceType(file);
  await validateAccountSourceType(csvSourceType, accountId);
  const source = await createSource(accountId, csvSourceType);
  logger.debug({ source }, 'Created Source in database');

  logger.debug(
    {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
    'Starting file upload:',
  );
  await s3Service.upload(sourceS3Key(source), file);

  return source;
}

const sourceService = {
  putSourceFile,
  getSourceTypeColumnMapping,
};

export default sourceService;
