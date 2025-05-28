import { SourceType } from '@/prisma';

import accountService from './account.service';

import { accountFactory, userFactory, bankFactory } from '@/factories';

describe('accountService', () => {
  let userId: number;
  let bankNumber: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    const user = await userFactory.create();
    const bank = await bankFactory.create();
    userId = user.id;
    bankNumber = bank.number;
  });

  it('should create a new account if it does not exist', async () => {
    const input = {
      userId,
      bankNumber,
      name: 'Test Account',
      color: 'blue',
      sourceType: SourceType.NUBANK_ACCOUNT_CSV,
    };
    const account = await accountService.firstOrCreate(input);
    expect(account).toMatchObject(input);
    expect(account.id).toBeDefined();
    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
  });

  it('should return the existing account if it already exists', async () => {
    const input = {
      userId,
      bankNumber,
      name: 'Test Account',
      color: 'blue',
      sourceType: SourceType.NUBANK_ACCOUNT_CSV,
    };
    const created = await accountFactory.create({
      name: input.name,
      color: input.color,
      sourceType: input.sourceType,
      user: { connect: { id: userId } },
      bank: { connect: { number: bankNumber } },
    });
    const found = await accountService.firstOrCreate(input);
    expect(found.id).toBe(created.id);
    expect(found).toMatchObject(input);
  });
});
