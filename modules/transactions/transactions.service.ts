import getPrisma from '@/common/prisma';

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

const transactionsService = { countTransactionsPerMonth };
export default transactionsService;
