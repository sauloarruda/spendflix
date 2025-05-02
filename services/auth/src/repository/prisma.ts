import { PrismaClient } from '../../generated/prisma';

let prisma: PrismaClient;

export default function getPrisma(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}
