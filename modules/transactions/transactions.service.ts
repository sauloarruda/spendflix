import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

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

async function getUncategorizedTransactions(userId: number): Promise<{
  categorizedPercent: number;
  transactions: UncategorizedTransaction[];
}> {
  logger.debug({ userId }, 'Get transactions for user');
  const transactions = await getPrisma().transaction.findMany({
    where: {
      categoryId: null,
      account: {
        userId,
      },
    },
  });
  return {
    categorizedPercent: 0.9,
    transactions: transactions.map((transaction) => ({
      ids: [transaction.id],
      descriptions: [transaction.description],
      values: [transaction.amount.toNumber()],
    })),
  };
}

const transactionsService = { countTransactionsPerMonth, getUncategorizedTransactions };
export default transactionsService;
