import { createHash } from 'crypto';

import {
  Prisma, Source, SourceStatus, Transaction,
} from '@/prisma';
import Papa from 'papaparse';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';
import s3Service from '@/common/s3';
import { categorizerService } from '@/modules/categorization';

import sourceService from './source.service';

const logger = getLogger().child({ module: 'importer' });

async function getFileFromSource(source: Source): Promise<string> {
  const key = [source.id, 'csv'].join('.');
  return s3Service.get(key);
}

function parseCsv(csvContents: string): Record<string, string>[] {
  const csv = Papa.parse(csvContents, {
    header: true,
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
  amount: Prisma.Decimal;
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
): {
  accountId: string;
  sourceId: string;
  date: Date;
  description: string;
  amount: Prisma.Decimal;
} {
  const columnMapping = sourceService.getSourceTypeColumnMapping()[source.type];
  return {
    accountId: source.accountId,
    sourceId: source.id,
    date: parseDate(row[columnMapping.date].trim()),
    description: row[columnMapping.description],
    amount: columnMapping.invertAmountSignal
      ? new Prisma.Decimal(-1 * parseFloat(row[columnMapping.amount]))
      : new Prisma.Decimal(parseFloat(row[columnMapping.amount])),
  };
}

async function hasTransaction(checksum: string): Promise<boolean> {
  return !!(await getPrisma().transaction.findUnique({ where: { checksum } }));
}

const IGNORED_DESCRIPTIONS = [/Pagamento recebido/];
const CSV_MIN_COLS = 3;

// eslint-disable-next-line max-lines-per-function
async function processRow(
  row: Record<string, string>,
  source: Source,
): Promise<Transaction | undefined> {
  logger.debug({ row }, 'Processing row');
  if (Object.keys(row).length < CSV_MIN_COLS) return undefined;

  const data = transformRowToData(row, source);
  if (IGNORED_DESCRIPTIONS.some((regex) => regex.test(data.description))) {
    logger.info('Ignored description');
    return undefined;
  }
  const checksum = calculateChecksum(data);
  if (await hasTransaction(checksum)) return undefined;

  const categoryRule = await categorizerService.inferCategory(data.description, source.accountId);
  const transactionData = {
    ...data,
    checksum,
    categoryId: categoryRule?.categoryId,
    categoryRuleId: categoryRule?.id,
  };
  logger.debug({ data: transactionData }, 'Inserting transaction');
  return getPrisma().transaction.create({
    data: transactionData,
  });
}

async function importFromSource(source: Source) {
  logger.info({ source }, 'Started importing transactions');
  const csvContents = await getFileFromSource(source);
  const rows = parseCsv(csvContents);
  await Promise.all(rows.map((row) => processRow(row, source))).catch((error) => {
    logger.error({ error }, 'Error processing row');
  });
  logger.info(`Finished importing ${rows.length} transactions`);
  await getPrisma().source.update({
    where: { id: source.id },
    data: { status: SourceStatus.COMPLETED },
  });
  return rows.length;
}

const importerService = { importFromSource };
export default importerService;
