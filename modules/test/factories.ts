import {
  defineAccountFactory,
  defineBankFactory,
  defineSourceFactory,
  defineUserFactory,
  initialize,
  defineTransactionFactory,
  defineCategoryFactory,
} from '@/fabbrica';

import getPrisma from '@/common/prisma';

// Initialize fabbrica with prisma
initialize({ prisma: getPrisma() });

// Export all factories for reuse
export const bankFactory = defineBankFactory();
export const userFactory = defineUserFactory();
export const accountFactory = defineAccountFactory({
  defaultData: {
    user: userFactory,
    bank: bankFactory,
  },
});
export const sourceFactory = defineSourceFactory({
  defaultData: { account: accountFactory },
});
export const transactionFactory = defineTransactionFactory({
  defaultData: {
    account: accountFactory,
    source: sourceFactory,
  },
});
export const categoryFactory = defineCategoryFactory({});
