import { SourceStatus, SourceType, Account } from '@/prisma';

import s3Service from '@/common/s3';
import { accountFactory } from '@/factories';

import sourceService from './source.service';

// Mocks
jest.mock('@/common/logger', () => () => ({ child: () => ({ debug: jest.fn() }) }));
jest.mock('@/common/s3', () => ({ upload: jest.fn() }));

describe('sourceService', () => {
  let account: Account;

  beforeEach(async () => {
    jest.clearAllMocks();
    account = await accountFactory.create({ sourceType: SourceType.NUBANK_ACCOUNT_CSV });
  });

  describe('putSourceFile', () => {
    it('should upload a valid NUBANK_ACCOUNT_CSV file and create a source', async () => {
      const csv = 'Data,Valor,Identificador,Descrição\n01/03/2025,1000,abc,Test Desc';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const source = await sourceService.putSourceFile(account.id, file);
      expect(source.accountId).toBe(account.id);
      expect(source.type).toBe(SourceType.NUBANK_ACCOUNT_CSV);
      expect(source.status).toBe(SourceStatus.PENDING);
      expect(s3Service.upload).toHaveBeenCalledWith(`${source.id}.csv`, file);
    });

    it('should upload a valid NUBANK_CREDIT_CARD_CSV file and create a source', async () => {
      const cardAccount = await accountFactory.create({
        sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
      });
      const csv = 'date,amount,title\n2025-03-03,100,Test Card';
      const file = new File([csv], 'test_card.csv', { type: 'text/csv' });
      const source = await sourceService.putSourceFile(cardAccount.id, file);
      expect(source.accountId).toBe(cardAccount.id);
      expect(source.type).toBe(SourceType.NUBANK_CREDIT_CARD_CSV);
      expect(source.status).toBe(SourceStatus.PENDING);
      expect(s3Service.upload).toHaveBeenCalledWith(`${source.id}.csv`, file);
    });

    it('should throw if file headers do not match any known source type', async () => {
      const csv = 'foo,bar,baz\n1,2,3';
      const file = new File([csv], 'invalid.csv', { type: 'text/csv' });
      await expect(sourceService.putSourceFile(account.id, file)).rejects.toThrow(
        "Can't determine type with headers: foo,bar,baz",
      );
    });

    it('should throw if account sourceType does not match CSV type', async () => {
      const cardAccount = await accountFactory.create({
        sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
      });
      const csv = 'Data,Valor,Identificador,Descrição\n01/03/2025,1000,abc,Test Desc';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      await expect(sourceService.putSourceFile(cardAccount.id, file)).rejects.toThrow(
        'Account sourceType (NUBANK_CREDIT_CARD_CSV) is incompatible with CSV sourceType (NUBANK_ACCOUNT_CSV)',
      );
    });

    it('should throw if file is empty', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });
      await expect(sourceService.putSourceFile(account.id, file)).rejects.toThrow(
        'File is empty or has no valid data',
      );
    });
  });

  describe('detectCsvSourceType', () => {
    it('should detect NUBANK_ACCOUNT_CSV type', async () => {
      const csv = 'Data,Valor,Identificador,Descrição\n01/03/2025,1000,abc,Test Desc';
      const file = new File([csv], 'test.csv', { type: 'text/csv' });
      const type = await sourceService.putSourceFile(account.id, file);
      expect(type.type).toBe(SourceType.NUBANK_ACCOUNT_CSV);
    });
    it('should detect NUBANK_CREDIT_CARD_CSV type', async () => {
      const cardAccount = await accountFactory.create({
        sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
      });
      const csv = 'date,amount,title\n2025-03-03,100,Test Card';
      const file = new File([csv], 'test_card.csv', { type: 'text/csv' });
      const type = await sourceService.putSourceFile(cardAccount.id, file);
      expect(type.type).toBe(SourceType.NUBANK_CREDIT_CARD_CSV);
    });
  });
});
