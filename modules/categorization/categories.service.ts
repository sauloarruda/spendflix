import getPrisma from '@/common/prisma';

async function findAll() {
  return getPrisma().category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

const categoriesService = { findAll };
export default categoriesService;
