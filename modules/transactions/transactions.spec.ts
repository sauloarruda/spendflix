import getPrisma from '../common/prisma';

import transactionsService from './transactions.service';

import { userFactory, accountFactory, categoryFactory, transactionFactory } from '@/factories';

describe('transactionsService', () => {
  let user: Awaited<ReturnType<typeof userFactory.create>>;
  let account: Awaited<ReturnType<typeof accountFactory.create>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    user = await userFactory.create();
    account = await accountFactory.create({ user: { connect: { id: user.id } } });
  });

  describe('countTransactionsPerMonth', () => {
    it('should count transactions per month for an account', async () => {
      await transactionFactory.createList(3, {
        account: { connect: { id: account.id } },
        date: new Date('2024-01-15'),
        amount: 100,
      });
      const result = await transactionsService.countTransactionsPerMonth(account.id);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('_count');
      expect(result[0]).toHaveProperty('_sum');
    });
  });

  describe('getUncategorizedTransactions', () => {
    it('should return uncategorized transactions and percent', async () => {
      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: undefined,
        description: 'Uncat',
      });
      // eslint-disable-next-line operator-linebreak
      const { categorizedPercent, transactions } =
        await transactionsService.getUncategorizedTransactions(user.id);
      expect(typeof categorizedPercent).toBe('number');
      expect(Array.isArray(transactions)).toBe(true);
      if (transactions.length > 0) {
        expect(transactions[0]).toHaveProperty('ids');
        expect(transactions[0]).toHaveProperty('descriptions');
        expect(transactions[0]).toHaveProperty('values');
      }
    });

    it('should group uncategorized transactions with the same description', async () => {
      await transactionFactory.createList(3, {
        account: { connect: { id: account.id } },
        category: undefined,
        description: 'Same Description',
      });
      const { transactions } = await transactionsService.getUncategorizedTransactions(user.id);
      // There should be only one group
      expect(transactions.length).toBe(1);
      expect(transactions[0].ids.length).toBe(3);
      expect(transactions[0].descriptions.every((desc) => desc === 'Same Description')).toBe(true);
    });
  });

  describe('updateCategory', () => {
    it('should update category and categoryRuleId for given transactions', async () => {
      const category = await categoryFactory.create();
      const txs = await transactionFactory.createList(2, {
        account: { connect: { id: account.id } },
        category: undefined,
        description: 'ToCategorize',
      });
      const ids = txs.map((t) => t.id);
      await transactionsService.updateCategory(ids, category.id);
      const updated = await getPrisma().transaction.findMany({ where: { id: { in: ids } } });
      updated.forEach((t) => {
        expect(t.categoryId).toBe(category.id);
        expect(typeof t.categoryRuleId).toBe('string');
        expect(t.categoryRuleId).toBeTruthy();
        expect(t.categoryScore).toBe(1);
      });
    });

    it('should do nothing if transactionIds is empty', async () => {
      const category = await categoryFactory.create();
      // Should not throw or update anything
      await expect(transactionsService.updateCategory([], category.id)).resolves.toBeUndefined();
    });
  });

  describe('updateNotes', () => {
    it('should update notes for a transaction', async () => {
      const tx = await transactionFactory.create({ account: { connect: { id: account.id } } });
      await transactionsService.updateNotes(tx.id, 'Test note');
      const updated = await getPrisma().transaction.findFirstOrThrow({ where: { id: tx.id } });
      expect(updated.notes).toBe('Test note');
    });
  });

  describe('getTransactionsByFilter', () => {
    it('should return transactions filtered by user and date', async () => {
      await transactionFactory.create({
        account: { connect: { id: account.id } },
        date: new Date(),
      });
      const txs = await transactionsService.getTransactionsByFilter({ userId: user.id });
      expect(Array.isArray(txs)).toBe(true);
      if (txs.length > 0) {
        expect(txs[0]).toHaveProperty('category');
        expect(txs[0]).toHaveProperty('account');
      }
    });
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      const tx = await transactionFactory.create({ account: { connect: { id: account.id } } });
      const found = await transactionsService.findById(tx.id);
      expect(found.id).toBe(tx.id);
    });
  });
});
