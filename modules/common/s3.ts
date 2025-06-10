import {
  GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig,
} from '@aws-sdk/client-s3';

import getConfig from './config';
import getLogger from './logger';

const logger = getLogger().child({ module: 's3' });

let s3: S3Client;
let defaultBucket: string | undefined;

function getBucket() {
  if (!defaultBucket) {
    defaultBucket = getConfig().S3_BUCKET;
    if (!defaultBucket) {
      throw new Error('S3_BUCKET environment variable is not set');
    }
  }
  return defaultBucket;
}

// eslint-disable-next-line max-lines-per-function
function getS3() {
  const REGION = getConfig().S3_REGION;
  if (!s3) {
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
        bucket: getBucket(),
        region: REGION,
        hasAccessKey: !!getConfig().S3_KEY,
        hasSecretKey: !!getConfig().S3_SECRET,
      },
      'Initializing s3Service',
    );

    let s3Config: S3ClientConfig = {
      region: REGION,
      credentials: {
        accessKeyId: getConfig().S3_KEY as string,
        secretAccessKey: getConfig().S3_SECRET as string,
      },
    };
    if (getConfig().S3_ENDPOINT) {
      s3Config = {
        ...s3Config,
        endpoint: getConfig().S3_ENDPOINT,
        forcePathStyle: true,
      };
    }
    s3 = new S3Client(s3Config);
  }
  return s3;
}

/**
 * Uploads file to S3
 */
async function upload(
  key: string,
  file: { arrayBuffer: () => Promise<Buffer | ArrayBuffer>; type: string },
) {
  const Body = (await file.arrayBuffer()) as Buffer;
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body,
    ContentType: file.type,
  });

  await getS3().send(command);
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
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  const response = await getS3().send(command);

  if (!response.Body) {
    throw new Error('Empty response from S3');
  }

  return streamToString(response.Body as unknown as NodeJS.ReadableStream);
}

const s3Service = { upload, get };
export default s3Service;
