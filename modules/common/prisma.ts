import { PrismaClient } from '@/prisma';
import getConfig from './config';

let prisma: PrismaClient;

export default function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: getConfig().DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}
