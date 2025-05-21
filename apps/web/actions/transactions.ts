'use server';

import { TransactionsFilter, transactionsService } from '@/modules/transactions';

async function getUncategorizedTransactionsAction(userId: number) {
  return transactionsService.getUncategorizedTransactions(userId);
}

async function updateCategoryAction(transactionIds: string[], categoryId: string) {
  await transactionsService.updateCategory(transactionIds, categoryId);
}

export type TransactionDto = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  color: string;
  account: string;
};

async function getTransactionsByFilterAction(
  filter: TransactionsFilter,
): Promise<TransactionDto[]> {
  return (await transactionsService.getTransactionsByFilter(filter)).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount.toNumber(),
    category: transaction.category!.name,
    color: transaction.category!.color,
    account: transaction.account!.name,
  }));
}

export { getUncategorizedTransactionsAction, updateCategoryAction, getTransactionsByFilterAction };
