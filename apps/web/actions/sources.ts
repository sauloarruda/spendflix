'use server';

import getLogger from '@/common/logger';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { PrismaClient, SourceStatus, SourceType } from '@/prisma';

const logger = getLogger().child({ module: 'sources' });

const Bucket = process.env.AMPLIFY_BUCKET;
const region = process.env.AWS_REGION;

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
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  },
  'S3 Configuration:',
);

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

async function putSourceFile(file: File) {
  try {
    const source = await new PrismaClient().source.create({
      data: {
        accountId: '1',
        type: SourceType.NUBANK_ACCOUNT_CSV,
        status: SourceStatus.PENDING,
      },
    });
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

    const Body = (await file.arrayBuffer()) as unknown as Buffer;
    const command = new PutObjectCommand({
      Bucket,
      Key: [source.id, 'csv'].join('.'),
      Body,
      ContentType: file.type,
    });

    await s3.send(command);
    logger.debug('File uploaded successfully');

    return { success: true, message: 'Arquivo enviado com sucesso. Processando transações...' };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        bucket: Bucket,
        region,
      },
      'Error uploading file:',
    );

    const errorMessages = {
      ENOTFOUND: `Bucket not found. Please check if the bucket '${Bucket}' exists in region '${region}'`,
      AccessDenied: 'Access denied. Please check your AWS credentials',
      InvalidAccessKeyId: 'Invalid AWS access key',
      SignatureDoesNotMatch: 'Invalid AWS secret key',
    };

    const getErrorMessage = (err: Error) => {
      const matchedError = Object.entries(errorMessages).find(([key]) => err.message.includes(key));
      return matchedError ? matchedError[1] : 'Erro ao enviar arquivo.';
    };

    const errorMessage =
      error instanceof Error ? getErrorMessage(error) : 'Erro ao enviar arquivo.';

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export { putSourceFile };
