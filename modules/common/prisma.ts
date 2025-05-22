import { PrismaClient } from '@/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

import getConfig from './config';

// const prismaClientPropertyName = '__prevent-name-collision__prisma';
// type GlobalThisWithPrismaClient = typeof globalThis & {
//   [prismaClientPropertyName]: PrismaClient;
// };

let prismaClient: PrismaClient;

function createClient() {
  if (!prismaClient) {
    const adapter = new PrismaPg({ connectionString: getConfig().DATABASE_URL });
    prismaClient = new PrismaClient({ adapter });
  }
  return prismaClient;
}

export default function getPrisma(): PrismaClient {
  return createClient();
  // if (process.env.NODE_ENV === 'production') {
  //   return createClient();
  // }
  // const newGlobalThis = globalThis as GlobalThisWithPrismaClient;
  // if (!newGlobalThis[prismaClientPropertyName]) {
  //   newGlobalThis[prismaClientPropertyName] = createClient();
  // }
  // return newGlobalThis[prismaClientPropertyName];
}
