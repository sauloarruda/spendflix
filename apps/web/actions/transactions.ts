'use server';

import { transactionsService } from '@/modules/transactions';

async function getUncategorizedTransactionsAction(userId: number) {
  return transactionsService.getUncategorizedTransactions(userId);
}

export { getUncategorizedTransactionsAction };
