'use server';

import { TransactionsFilter, transactionsService } from '@/modules/transactions';

async function getUncategorizedTransactionsAction(userId: number) {
  return transactionsService.getUncategorizedTransactions(userId);
}

async function updateTransactionCategoryAction(transactionIds: string[], categoryId: string) {
  await transactionsService.updateCategory(transactionIds, categoryId);
}

async function updateTransactionNotesAction(transactionId: string, notes: string | null) {
  await transactionsService.updateNotes(transactionId, notes);
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
  notes: string | null;
};

async function getTransactionsByFilterAction(
  filter: TransactionsFilter,
): Promise<TransactionDto[]> {
  return (await transactionsService.getTransactionsByFilter(filter)).map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    categoryName: transaction.category?.name ?? 'Sem categoria',
    categoryColor: transaction.category?.color ?? 'red-900',
    accountName: transaction.account!.name,
    accountColor: transaction.account!.color,
    notes: transaction.notes,
  }));
}

async function findTransactionByIdAction(id: string) {
  return transactionsService.findById(id);
}

export {
  getUncategorizedTransactionsAction,
  updateTransactionCategoryAction,
  getTransactionsByFilterAction,
  findTransactionByIdAction,
  updateTransactionNotesAction,
};
