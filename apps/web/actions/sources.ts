'use server';

import { importerService, sourceService } from '@/modules/transactions';

async function putSourceFileAction(file: File, accountId: string) {
  const source = await sourceService.putSourceFile(accountId, file);
  if (!source.sourceTypeId) {
    // user need to create a source type
    throw new Error('Source type not found');
  }
  return importerService.importFromSource(source!);
}

export { putSourceFileAction };
