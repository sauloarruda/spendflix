import { PrismaClient } from '../../generated/prisma';
import getConfig from '../../lib/config';

let prisma: PrismaClient;

export default function getPrisma(): PrismaClient {
  if (!prisma) {
    const config =
      getConfig().NODE_ENV === 'test'
        ? {
            datasourceUrl:
              'postgresql://postgres:postgres@localhost:5432/spendflix_test?schema=public',
          }
        : undefined;

    prisma = new PrismaClient(config);
  }
  return prisma;
}
