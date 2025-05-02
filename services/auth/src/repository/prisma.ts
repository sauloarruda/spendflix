import { PrismaClient } from '../../generated/prisma';

let prisma: PrismaClient;

export default function getPrisma(): PrismaClient {
  if (!prisma) {
    const config = {};
    // getConfig().NODE_ENV === 'test'
    //   ? {
    //       datasourceUrl:
    //         'postgresql://postgres:postgres@localhost:5432/spendflix_test?schema=public',
    //     }
    //   : undefined;

    prisma = new PrismaClient(config);
  }
  return prisma;
}
