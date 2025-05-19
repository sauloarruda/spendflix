'use server';

import { importerService, sourceService } from '@/modules/transactions';

async function putSourceFile(file: File, accountId: string) {
  const response = await sourceService.putSourceFile(accountId, file);
  return importerService.importFromSource(response.source!);
}

export { putSourceFile };
