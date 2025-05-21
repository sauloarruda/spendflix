import { PrismaClient } from '@/prisma';

import getConfig from './config';

const prismaClientPropertyName = '__prevent-name-collision__prisma';
type GlobalThisWithPrismaClient = typeof globalThis & {
  [prismaClientPropertyName]: PrismaClient;
};

function createClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: getConfig().DATABASE_URL,
      },
    },
  });
}

export default function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    return createClient();
  }
  const newGlobalThis = globalThis as GlobalThisWithPrismaClient;
  if (!newGlobalThis[prismaClientPropertyName]) {
    newGlobalThis[prismaClientPropertyName] = createClient();
  }
  return newGlobalThis[prismaClientPropertyName];
}
