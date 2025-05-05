import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Create banks
  const banks = [
    { number: '001', name: 'Banco do Brasil' },
    { number: '033', name: 'Santander' },
    { number: '104', name: 'Caixa Econômica Federal' },
    { number: '237', name: 'Bradesco' },
    { number: '341', name: 'Itaú' },
    { number: '260', name: 'Nubank' },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { number: bank.number },
      update: {},
      create: bank,
    });
  }

  // Create categories
  const categories = [
    {
      name: 'Alimentação',
      color: '#FF5733',
      children: [
        { name: 'Supermercado', color: '#FF8C33' },
        { name: 'Restaurante', color: '#FFB533' },
        { name: 'Lanche', color: '#FFD633' },
      ],
    },
    {
      name: 'Transporte',
      color: '#33FF57',
      children: [
        { name: 'Combustível', color: '#33FF8C' },
        { name: 'Táxi', color: '#33FFB5' },
        { name: 'Ônibus', color: '#33FFD6' },
      ],
    },
    {
      name: 'Moradia',
      color: '#3357FF',
      children: [
        { name: 'Aluguel', color: '#338CFF' },
        { name: 'Condomínio', color: '#33B5FF' },
        { name: 'Manutenção', color: '#33D6FF' },
      ],
    },
    {
      name: 'Saúde',
      color: '#F033FF',
      children: [
        { name: 'Médico', color: '#F08CFF' },
        { name: 'Farmácia', color: '#F0B5FF' },
        { name: 'Plano de Saúde', color: '#F0D6FF' },
      ],
    },
    {
      name: 'Educação',
      color: '#FF33F0',
      children: [
        { name: 'Cursos', color: '#FF8CF0' },
        { name: 'Material Escolar', color: '#FFB5F0' },
        { name: 'Livros', color: '#FFD6F0' },
      ],
    },
  ];

  for (const category of categories) {
    const parent = await prisma.category.create({
      data: {
        name: category.name,
        color: category.color,
      },
    });

    for (const child of category.children) {
      await prisma.category.create({
        data: {
          name: child.name,
          color: child.color,
          parentCategoryId: parent.id,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
