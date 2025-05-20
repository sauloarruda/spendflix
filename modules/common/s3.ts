import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import getConfig from './config';
import getLogger from './logger';

const logger = getLogger().child({ module: 's3' });

const BUCKET = getConfig().S3_BUCKET;
const REGION = getConfig().S3_REGION;

if (!BUCKET) {
  throw new Error('S3_BUCKET environment variable is not set');
}

if (!REGION) {
  throw new Error('S3_REGION environment variable is not set');
}

// Validate region format
if (!REGION.match(/^[a-z]{2}-[a-z]+-\d+$/)) {
  throw new Error(
    `Invalid AWS region format: ${REGION}. Expected format: us-east-1, us-west-2, etc.`,
  );
}

logger.debug(
  {
    bucket: BUCKET,
    region: REGION,
    hasAccessKey: !!getConfig().S3_KEY,
    hasSecretKey: !!getConfig().S3_SECRET,
  },
  'Initializing s3Service',
);

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: getConfig().S3_KEY as string,
    secretAccessKey: getConfig().S3_SECRET as string,
  },
});

/**
 * Uploads file to S3
 */
async function upload(
  key: string,
  file: { arrayBuffer: () => Promise<Buffer | ArrayBuffer>; type: string },
) {
  const Body = (await file.arrayBuffer()) as Buffer;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body,
    ContentType: file.type,
  });

  await s3.send(command);
  logger.debug('File uploaded successfully');
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

async function get(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);

  if (!response.Body) {
    throw new Error('Empty response from S3');
  }

  return streamToString(response.Body as unknown as NodeJS.ReadableStream);
}

const s3Service = { upload, get };
export default s3Service;
