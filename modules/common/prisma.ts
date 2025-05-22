import { PrismaClient } from '@/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

import getConfig from './config';

const prismaClientPropertyName = '__prevent-name-collision__prisma';
type GlobalThisWithPrismaClient = typeof globalThis & {
  [prismaClientPropertyName]: PrismaClient;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString: getConfig().DATABASE_URL });
  return new PrismaClient({ adapter });
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
