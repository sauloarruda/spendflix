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
  categoryName: string;
  categoryColor: string;
  accountName: string;
  accountColor: string;
};

async function getTransactionsByFilterAction(
  filter: TransactionsFilter,
): Promise<TransactionDto[]> {
  return (await transactionsService.getTransactionsByFilter(filter)).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    categoryName: transaction.category!.name,
    categoryColor: transaction.category!.color,
    accountName: transaction.account!.name,
    accountColor: transaction.account!.color,
  }));
}

async function findTransactionByIdAction(id: string) {
  return transactionsService.findById(id);
}

export {
  getUncategorizedTransactionsAction,
  updateCategoryAction,
  getTransactionsByFilterAction,
  findTransactionByIdAction,
};
