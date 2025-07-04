'use server';

import { accountService, transactionsService } from '@/modules/transactions';

import { Account, SourceType } from '@/prisma';

import { authorizeAction } from './serverActions';

async function createAccountsAction(
  session: string | undefined,
  accountInputs: {
    userId: number;
    bankNumber: string;
    name: string;
    color: string;
    sourceType: SourceType;
  }[],
): Promise<Account[]> {
  return authorizeAction(session, () =>
    Promise.all(accountInputs.map((input) => accountService.firstOrCreate(input))),
  );
}

async function countTransactionsPerMonthAction(session: string | undefined, accountId: string) {
  return transactionsService.countTransactionsPerMonth(accountId);
}

export { createAccountsAction, countTransactionsPerMonthAction };
