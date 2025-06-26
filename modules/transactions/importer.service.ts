import { createHash } from 'crypto';

import { Source, SourceStatus, Transaction } from '@/prisma';
import Papa from 'papaparse';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';
import LimitedConcurrentPromise from '@/common/promise';
import s3Service from '@/common/s3';
import Timer from '@/common/timer';
import { categorizerService } from '@/modules/categorization';

import { SourceTypeConfig } from './source.service';

const logger = getLogger().child({ module: 'importer' });

async function getFileFromSource(source: Source): Promise<string> {
  const key = [source.id, 'csv'].join('.');
  return s3Service.get(key);
}

function parseCsv(csvContents: string): Record<string, string>[] {
  const csv = Papa.parse(csvContents, {
    header: true,
    skipEmptyLines: true,
  });
  return csv.data as Record<string, string>[];
}

function parseDate(dateStr: string): Date {
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(Date.parse(dateStr));
  return new Date(Date.parse(dateStr.split('/').reverse().join('-')));
}

function calculateChecksum(data: {
  accountId: string;
  date: Date;
  description: string;
  amount: number;
}): string {
  // Normalize the data to ensure consistent hashing
  const normalizedDate = data.date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const normalizedDescription = data.description.trim().toLowerCase();
  const normalizedAmount = data.amount.toFixed(2); // Ensure consistent decimal places

  // Create a string with all fields
  const dataToHash = `${data.accountId}|${normalizedDate}|${normalizedDescription}|${normalizedAmount}`;

  // Generate SHA-256 hash
  return createHash('sha256').update(dataToHash).digest('hex');
}

function transformRowToData(
  row: Record<string, string>,
  source: Source,
  columnMapping: SourceTypeConfig,
): {
  accountId: string;
  sourceId: string;
  date: Date;
  description: string;
  amount: number;
} {
  return {
    accountId: source.accountId,
    sourceId: source.id,
    date: parseDate(row[columnMapping.headers.date].trim()),
    description: row[columnMapping.headers.description],
    amount: columnMapping.invertAmountSignal
      ? -1 * parseFloat(row[columnMapping.headers.amount])
      : parseFloat(row[columnMapping.headers.amount]),
  };
}

async function hasTransaction(checksum: string): Promise<boolean> {
  return !!(await getPrisma().transaction.findUnique({ where: { checksum } }));
}

const CSV_MIN_COLS = 3;

// eslint-disable-next-line max-lines-per-function
async function processRow(
  row: Record<string, string>,
  source: Source,
): Promise<Transaction | undefined> {
  if (Object.keys(row).length < CSV_MIN_COLS) return undefined;

  const sourceType = await getPrisma().sourceType.findFirst({
    where: { id: source.sourceTypeId || '' },
  });
  if (!sourceType) throw new Error('Source type not found');
  const columnMapping = sourceType?.config as SourceTypeConfig;

  const data = transformRowToData(row, source, columnMapping);
  if (
    columnMapping.ignoredDescriptions.some((ignored) => new RegExp(ignored).test(data.description))
  ) {
    logger.info('Ignored description');
    return undefined;
  }
  const checksum = calculateChecksum(data);
  if (await hasTransaction(checksum)) return undefined;

  const categoryRule = await categorizerService.inferCategory(
    data.description,
    source.accountId,
    data.amount,
  );
  const transactionData = {
    ...data,
    checksum,
    categoryId: categoryRule?.categoryId,
    categoryRuleId: categoryRule?.categoryRuleId,
    categoryScore: categoryRule?.score,
  };
  logger.debug({ data: transactionData }, 'Inserting transaction');
  return getPrisma().transaction.create({
    data: transactionData,
  });
}

async function importFromSource(source: Source) {
  const timer = Timer('importFromSource');
  logger.info({ source }, 'Started importing transactions');
  const csvContents = await getFileFromSource(source);
  const rows = parseCsv(csvContents);
  await LimitedConcurrentPromise.all(
    rows.map((row, i) => {
      logger.debug({ row }, `Processing row ${i + 1}/${rows.length}`);
      return processRow(row, source);
    }),
  );
  logger.info(`Finished importing ${rows.length} transactions`);
  await getPrisma().source.update({
    where: { id: source.id },
    data: { status: SourceStatus.COMPLETED },
  });
  timer.stop();
  return rows.length;
}

const importerService = { importFromSource };
export default importerService;
