'use server';

import { accountService, transactionsService } from '@/modules/transactions';

import { Account, SourceType } from '@/prisma';

async function createAccountsAction(
  accountInputs: {
    userId: number;
    bankNumber: string;
    name: string;
    color: string;
    sourceType: SourceType;
  }[],
): Promise<Account[]> {
  return Promise.all(accountInputs.map((input) => accountService.firstOrCreate(input)));
}

async function countTransactionsPerMonthAction(accountId: string) {
  return transactionsService.countTransactionsPerMonth(accountId);
}

async function createAccountAction(accountInput: {
  userId: number;
  bankNumber: string;
  name: string;
  color: string;
  sourceType: SourceType;
}): Promise<Account> {
  return accountService.firstOrCreate(accountInput);
}

export { createAccountAction, createAccountsAction, countTransactionsPerMonthAction };
