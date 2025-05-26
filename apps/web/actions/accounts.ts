'use server';

import { accountService, transactionsService } from '@/modules/transactions';

import { Account, SourceType } from '@/prisma';

async function createAccountAction(accountInput: {
  userId: number;
  bankNumber: string;
  name: string;
  color: string;
  sourceType: SourceType;
}): Promise<Account> {
  return accountService.firstOrCreate(accountInput);
}

async function countTransactionsPerMonthAction(accountId: string) {
  return transactionsService.countTransactionsPerMonth(accountId);
}

export { createAccountAction, countTransactionsPerMonthAction };
