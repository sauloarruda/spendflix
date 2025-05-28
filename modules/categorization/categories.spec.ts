import type { Category } from '@/prisma';

import getPrisma from '@/common/prisma';

import { categoryFactory } from '../test/factories';

import categoriesService from './categories.service';

describe('categoriesService', () => {
  let createdCategories: Category[] = [];
  afterEach(async () => {
    // Clean up created categories
    if (createdCategories.length) {
      const prisma = getPrisma();
      await prisma.category.deleteMany({
        where: {
          id: { in: createdCategories.map((c) => c.id) },
        },
      });
      createdCategories = [];
    }
  });

  it('findAll returns categories ordered by name', async () => {
    // Insert categories in random order
    const catB = await categoryFactory.create({ name: 'B' });
    const catA = await categoryFactory.create({ name: 'A' });
    createdCategories.push(catA, catB);
    const result = await categoriesService.findAll();
    // Only check for the categories we created
    const filtered = (result as Category[]).filter((c) =>
      // eslint-disable-next-line implicit-arrow-linebreak
      createdCategories.some((cc) => cc.id === c.id));
    expect(filtered.map((c) => c.name)).toEqual(['A', 'B']);
  });
});
