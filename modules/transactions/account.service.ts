import { Account } from '@/prisma';

import getPrisma from '@/common/prisma';

type AccountInput = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;

async function firstOrCreate(data: AccountInput): Promise<Account> {
  const existentAccount = await getPrisma().account.findFirst({ where: data });
  if (existentAccount) return existentAccount;

  return getPrisma().account.create({
    data,
  });
}

const accountService = { firstOrCreate };

export default accountService;
