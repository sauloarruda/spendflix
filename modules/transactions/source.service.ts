import { Source, SourceStatus, SourceType } from '@/prisma';
import Papa from 'papaparse';
import _ from 'underscore';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';
import s3Service from '@/common/s3';

export type SourceTypeConfig = {
  invertAmountSignal: boolean;
  headers: {
    date: string;
    amount: string;
    description: string;
  };
  ignoredDescriptions: string[];
};
const logger = getLogger().child({ module: 'sources' });

function headersKey(headers: string[]) {
  return headers.sort().join('|');
}

async function getSourceTypeColumnMapping(): Promise<Record<string, SourceType[]>> {
  const sourceTypes = await getPrisma().sourceType.findMany();
  const keyFunction = (source: SourceType) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    headersKey(Object.values((source.config as SourceTypeConfig).headers));
  return _.groupBy(sourceTypes, keyFunction);
}

async function determineSourceType(headers: string[]): Promise<SourceType | null> {
  const columnMapping = await getSourceTypeColumnMapping();
  logger.debug({ columnMapping }, 'columnMapping');
  const targetKey = headersKey(headers);

  // Find the SourceType array that matches the headers key
  const sourceTypes = columnMapping[targetKey];

  // Return the first SourceType from the array or null if not found
  return sourceTypes?.[0] || null;
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

async function createSource(accountId: string, type: SourceType | null) {
  return getPrisma().source.create({
    data: {
      accountId,
      sourceTypeId: type?.id,
      status: SourceStatus.PENDING,
    },
  });
}

async function detectCsvSourceType(file: File): Promise<SourceType | null> {
  const fileBuffer = await file.arrayBuffer();
  const fileContent = Buffer.from(fileBuffer).toString('utf8');
  const { headers } = parseCsvFile(fileContent);

  return determineSourceType(headers);
}

async function putSourceFile(accountId: string, file: File): Promise<Source> {
  logger.debug({ accountId, file }, 'putSourceFile');

  const csvSourceType = await detectCsvSourceType(file);
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
