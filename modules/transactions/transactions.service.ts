import { Transaction } from '@/prisma';

import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';
import { categorizerService } from '@/modules/categorization';

const logger = getLogger().child({ module: 'transactions' });

export type TransactionsPerMonth = [
  {
    month: Date;
    _count: number;
    _sum: number;
  },
];
async function countTransactionsPerMonth(accountId: string): Promise<TransactionsPerMonth> {
  return getPrisma().$queryRawUnsafe<TransactionsPerMonth>(
    `
    SELECT 
      to_char(t.date, 'YYYY-MM') as "month",
      count(t.id) as "_count",
      sum(t.amount)::int as "_sum"
    FROM "transactions" t
    WHERE t."accountId"=$1
    GROUP BY 1
    ORDER BY 1 desc
    `,
    accountId,
  );
}

export type UncategorizedTransaction = {
  ids: string[];
  descriptions: string[];
  values: number[];
};

async function findAllUncategorized(userId: number): Promise<Transaction[]> {
  return getPrisma().transaction.findMany({
    where: {
      categoryId: null,
      account: {
        userId,
      },
    },
  });
}

async function calculateUncategorizedPercent(
  transactions: Transaction[],
  userId: number,
): Promise<number> {
  const categorizedTransactionsCount = await getPrisma().transaction.count({
    where: {
      categoryId: { not: null },
      account: {
        userId,
      },
    },
  });
  return 1 - transactions.length / (categorizedTransactionsCount + transactions.length);
}

function groupUncategorizedTransactions(transactions: Transaction[]): UncategorizedTransaction[] {
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach((transaction) => {
    const sanitizedDescription = categorizerService.sanitizeDescription(transaction.description);
    if (!groups[sanitizedDescription]) groups[sanitizedDescription] = [transaction];
    else groups[sanitizedDescription].push(transaction);
  });

  return Object.values(groups).map((group: Transaction[]) => ({
    ids: group.map((g) => g.id),
    descriptions: group.map((g) => g.description),
    values: group.map((g) => g.amount),
  }));
}

async function getUncategorizedTransactions(userId: number): Promise<{
  categorizedPercent: number;
  transactions: UncategorizedTransaction[];
}> {
  logger.debug({ userId }, 'Get uncategorized transactions for user');
  const transactions = await findAllUncategorized(userId);
  return {
    categorizedPercent: await calculateUncategorizedPercent(transactions, userId),
    transactions: groupUncategorizedTransactions(transactions),
  };
}

async function updateCategory(transactionIds: string[], categoryId: string): Promise<void> {
  if (transactionIds.length === 0) return;
  const transaction = await getPrisma().transaction.findFirstOrThrow({
    where: { id: transactionIds[0] },
  });
  const categoryUserRule = await categorizerService.findOrCreateUserRule(
    transaction.description,
    categoryId,
    transaction.accountId,
  );
  await getPrisma().transaction.updateMany({
    where: { id: { in: transactionIds } },
    data: {
      categoryId,
      categoryRuleId: categoryUserRule.id,
      categoryScore: 1,
    },
  });
}

export type TransactionsFilter = {
  userId: number;
  dateStart?: Date;
  dateEnd?: Date;
};

// eslint-disable-next-line no-magic-numbers
const THREE_MONTHS = 24 * 3600 * 90 * 1000; // 90 days

async function getTransactionsByFilter(filter: TransactionsFilter) {
  const defaultFilter: Partial<TransactionsFilter> = {
    dateStart: new Date(new Date().getTime() - THREE_MONTHS),
    dateEnd: new Date(),
  };
  const queryFilter = {
    ...defaultFilter,
    ...filter,
  };
  return getPrisma().transaction.findMany({
    include: {
      category: true,
      account: true,
    },
    where: {
      account: {
        userId: queryFilter.userId,
      },
      AND: [{ date: { gte: queryFilter.dateStart } }, { date: { lte: queryFilter.dateEnd } }],
    },
    orderBy: {
      date: 'desc',
    },
  });
}

async function findById(id: string): Promise<Transaction> {
  return getPrisma().transaction.findFirstOrThrow({
    where: { id },
  });
}

const transactionsService = {
  countTransactionsPerMonth,
  getUncategorizedTransactions,
  updateCategory,
  getTransactionsByFilter,
  findById,
};
export default transactionsService;
