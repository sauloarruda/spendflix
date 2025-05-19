'use server';

import getPrisma from '@/common/prisma';
import { importerService, sourceService } from '@/modules/transactions';

async function putSourceFile(file: File) {
  const account = await getPrisma().account.findFirst();
  const response = await sourceService.putSourceFile(account!, file);
  return importerService.importFromSource(response.source!);
}

export { putSourceFile };
