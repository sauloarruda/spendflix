'use server';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient, SourceStatus, SourceType } from '../generated/prisma';

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

console.log('S3 Configuration:', {
  bucket: Bucket,
  region: region,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});

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
        userId: 1,
        type: SourceType.NUBANK_ACCOUNT_CSV,
        status: SourceStatus.PENDING,
      },
    });
    console.log('Created Source in database', source.id);

    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket: Bucket,
    });

    const Body = (await file.arrayBuffer()) as unknown as Buffer;
    const command = new PutObjectCommand({
      Bucket,
      Key: [source.id, 'csv'].join('.'),
      Body,
      ContentType: file.type,
    });

    await s3.send(command);
    console.log('File uploaded successfully');

    return { success: true, message: 'Arquivo enviado com sucesso. Processando transações...' };
  } catch (error) {
    console.error('Error uploading file:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucket: Bucket,
      region: region,
    });

    // Provide more user-friendly error messages
    let errorMessage = 'Erro ao enviar arquivo.';
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        errorMessage = `Bucket not found. Please check if the bucket '${Bucket}' exists in region '${region}'`;
      } else if (error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied. Please check your AWS credentials';
      } else if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'Invalid AWS access key';
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        errorMessage = 'Invalid AWS secret key';
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export { putSourceFile };
