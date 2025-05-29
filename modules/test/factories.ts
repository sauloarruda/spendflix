import {
  defineAccountFactory,
  defineBankFactory,
  defineSourceFactory,
  defineUserFactory,
  initialize,
  defineTransactionFactory,
  defineCategoryFactory,
  defineCategoryRuleFactory,
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
export const categoryRuleFactory = defineCategoryRuleFactory({
  defaultData: ({ seq }) => ({
    keyword: `keyword-${seq}`,
    priority: 1,
    ocurrences: 0,
    category: categoryFactory,
  }),
});
