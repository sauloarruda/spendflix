import {
  defineAccountFactory,
  defineBankFactory,
  defineSourceFactory,
  defineUserFactory,
  initialize,
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
