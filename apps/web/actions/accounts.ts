'use server';

import { accountService, transactionsService } from '@/modules/transactions';

import { SourceType } from '@/prisma';

async function createAccountAction(accountInput: {
  userId: number;
  bankNumber: string;
  name: string;
  color: string;
  sourceType: SourceType;
}): Promise<string> {
  return (await accountService.firstOrCreate(accountInput)).id;
}

async function countTransactionsPerMonthAction(accountId: string) {
  return transactionsService.countTransactionsPerMonth(accountId);
}

export { createAccountAction, countTransactionsPerMonthAction };
