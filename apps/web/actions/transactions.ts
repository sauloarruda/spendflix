'use server';

import { transactionsService } from '@/modules/transactions';

import { authorizeAction } from './serverActions';

async function getUncategorizedTransactionsAction(session: string | undefined, userId: number) {
  return authorizeAction(session, () => transactionsService.getUncategorizedTransactions(userId));
}

async function updateTransactionCategoryAction(
  session: string | undefined,
  transactionIds: string[],
  categoryId: string,
) {
  await authorizeAction(session, () =>
    transactionsService.updateCategory(transactionIds, categoryId),
  );
}

async function updateTransactionNotesAction(
  session: string | undefined,
  transactionId: string,
  notes: string | null,
) {
  await authorizeAction(session, () => transactionsService.updateNotes(transactionId, notes));
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
  isHidden: boolean;
  updatedAt: Date;
};

async function findTransactionByIdAction(session: string | undefined, id: string) {
  return authorizeAction(session, async () => transactionsService.findById(id));
}

async function showTransactionAction(session: string | undefined, id: string) {
  transactionsService.show(id);
}

async function hideTransactionAction(session: string | undefined, id: string) {
  transactionsService.hide(id);
}

export {
  getUncategorizedTransactionsAction,
  updateTransactionCategoryAction,
  findTransactionByIdAction,
  updateTransactionNotesAction,
  showTransactionAction,
  hideTransactionAction,
};
