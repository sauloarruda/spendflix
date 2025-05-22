'use server';

import { importerService, sourceService } from '@/modules/transactions';

async function putSourceFileAction(file: File, accountId: string) {
  const source = await sourceService.putSourceFile(accountId, file);
  return importerService.importFromSource(source!);
}

export { putSourceFileAction };
