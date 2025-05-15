import { Source, Transaction } from '@/prisma';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Papa from 'papaparse';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

const logger = getLogger().child({ module: 'importer' });
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

async function getS3FileContent(bucket: string, key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error('Empty response from S3');
  }

  return streamToString(response.Body as unknown as NodeJS.ReadableStream);
}

async function getFileFromSource(source: Source): Promise<string> {
  try {
    const key = `${source.id}.csv`;
    const bucket = process.env.AMPLIFY_BUCKET;

    if (!bucket) {
      throw new Error('AMPLIFY_BUCKET environment variable is not set');
    }

    return await getS3FileContent(bucket, key);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error, source }, 'Error reading CSV file');
    throw new Error(`Failed to read file: ${errorMessage}`);
  }
}

function parseCsv(csvContents: string): Record<string, string>[] {
  const csv = Papa.parse(csvContents, {
    header: true,
  });
  return csv.data as Record<string, string>[];
}

const SOURCE_TYPE_COLUMN_MAPPING = {
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

function parseDate(dateStr: string): Date {
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(Date.parse(dateStr));
  return new Date(Date.parse(dateStr.split('/').reverse().join('-')));
}

async function processRow(row: Record<string, string>, source: Source): Promise<Transaction> {
  const columnMapping = SOURCE_TYPE_COLUMN_MAPPING[source.type];
  return getPrisma().transaction.create({
    data: {
      accountId: source.accountId,
      sourceId: source.id,
      date: parseDate(row[columnMapping.date].trim()),
      description: row[columnMapping.description],
      amount: columnMapping.invertAmountSignal
        ? parseFloat(row[columnMapping.amount]) * -1
        : parseFloat(row[columnMapping.amount]),
    },
  });
}

async function importFromSource(source: Source) {
  logger.info({ source }, 'Started importing transactions');
  const csvContents = await getFileFromSource(source);
  const rows = parseCsv(csvContents);
  const res = await Promise.all(rows.map((row) => processRow(row, source)));
  logger.info(`Finished importing ${res.length} transactions`);
}

const importerService = { importFromSource };
export default importerService;
