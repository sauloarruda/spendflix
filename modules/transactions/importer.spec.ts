import { Readable } from 'stream';

import { Source, SourceType } from '@/prisma';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import { mockClient } from 'aws-sdk-client-mock';
import Papa from 'papaparse';

import getConfig from '@/common/config';

import getPrisma from '../common/prisma';

import importerService from './importer.service';

import { sourceFactory } from '@/factories';

// Mock getConfig
jest.mock('@/common/config', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    S3_BUCKET: 'test-bucket',
    S3_REGION: 'us-east-1',
    S3_KEY: 'test-key',
    S3_SECRET: 'test-secret',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/spendflix_test',
  }),
}));

const s3Mock = mockClient(S3Client);

function getExpectedTransactionsLength(csv: string) {
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return result.data.length;
}

function setupS3Mock(mockCsvContent: string) {
  const mockStream = new Readable();
  mockStream.push(Buffer.from(mockCsvContent));
  mockStream.push(null); // Signal the end of the stream

  s3Mock.on(GetObjectCommand).resolves({
    Body: sdkStreamMixin(mockStream),
  });
}

describe('Importer', () => {
  let mockCsvContent: string;
  let source: Source;

  beforeEach(async () => {
    s3Mock.reset();
    jest.clearAllMocks();
    // Use centralized sourceFactory
    // sourceFactory already has defaultData with accountFactory, which has user and bank
  });

  describe('NUBANK_ACCOUNT_CSV', () => {
    beforeEach(async () => {
      mockCsvContent = `Data,Valor,Identificador,Descrição
01/03/2025,2145.85,67c31d60-a481-4619-a0e3-5f3e85c76409,Transferência recebida pelo Pix - LUKE SKYWALKER - •••.221.982-•• - BCO DO BRASIL S.A. (0001) Agência: 3011 Conta: 91821-0
01/03/2025,-117.51,67c99ac4-7470-4ef8-bc68-b8d5b75ada1f,Débito em conta
10/03/2025,-36.80,67ceff0c-1e06-4e4d-b542-0710f075dca0,Compra no débito - Servicos Postais Pinh
17/03/2025,-359.42,67d3f4d4-8e3a-4e07-81b6-a647602a23b7,Pagamento de boleto efetuado - PREF MUN SAO PAULO-C
24/03/2025,218.96,67e15b8e-4b5b-4000-b60f-931875545d8f,Resgate RDB`;
      setupS3Mock(mockCsvContent);
      source = await sourceFactory.create({ type: SourceType.NUBANK_ACCOUNT_CSV });
    });

    it('should read CSV and create transactions', async () => {
      await importerService.importFromSource(source);

      expect(s3Mock.calls()).toHaveLength(1);
      const s3Call = s3Mock.call(0);
      expect(s3Call.args[0].input).toEqual({
        Bucket: getConfig().S3_BUCKET,
        Key: `${source.id}.csv`,
      });

      const transactions = await getPrisma().transaction.findMany({
        where: { sourceId: source.id },
      });
      expect(transactions.length).toBe(getExpectedTransactionsLength(mockCsvContent));
    });
  });

  describe('NUBANK_CARD_CSV', () => {
    beforeEach(async () => {
      mockCsvContent = `date,title,amount
2025-03-03,Vd Delivery,91.28
2025-03-10,Uber* Trip,25.84
2025-03-14,Google Youtube,19.99
2025-02-27,NuViagens - NuPay,327.68
2025-02-27,Vivo Sp Lj L561 - Parcela 7/12,391.58`;
      setupS3Mock(mockCsvContent);
      source = await sourceFactory.create({ type: SourceType.NUBANK_CREDIT_CARD_CSV });
    });

    it('should read CSV and create transactions', async () => {
      await importerService.importFromSource(source);

      expect(s3Mock.calls()).toHaveLength(1);
      const s3Call = s3Mock.call(0);
      expect(s3Call.args[0].input).toEqual({
        Bucket: getConfig().S3_BUCKET,
        Key: `${source.id}.csv`,
      });

      const transactions = await getPrisma().transaction.findMany({
        where: { sourceId: source.id },
      });
      expect(transactions.length).toBe(getExpectedTransactionsLength(mockCsvContent));
    });
  });
});
