'use server';

import { transactionsService } from '@/modules/transactions';

async function getUncategorizedTransactionsAction(userId: number) {
  return transactionsService.getUncategorizedTransactions(userId);
}

async function updateCategoryAction(transactionIds: string[], categoryId: string) {
  await transactionsService.updateCategory(transactionIds, categoryId);
}

export { getUncategorizedTransactionsAction, updateCategoryAction };
