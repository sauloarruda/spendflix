'use server';

import { accountService } from '@/modules/transactions';

async function createAccountAction(accountInput: {
  userId: number;
  bankNumber: string;
  name: string;
  color: string;
}): Promise<string> {
  return (await accountService.firstOrCreate(accountInput)).id;
}

export { createAccountAction };
