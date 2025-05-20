'use server';

import { categoriesService } from '@/modules/categorization';

async function getCategoriesAction() {
  return categoriesService.findAll();
}

export { getCategoriesAction };
