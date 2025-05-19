import { PrismaClient } from '../generated/prisma';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

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
    { name: 'Alimentação', color: 'indigo-200' },
    { name: 'Filhos', color: 'yellow-300' },
    { name: 'Moradia', color: 'green-100' },
    { name: 'Transporte', color: 'purple-200' },
    { name: 'Lazer', color: 'green-300' },
    { name: 'Compras', color: 'orange-200' },
    { name: 'Serviços', color: 'pink-200' },
    { name: 'Saúde', color: 'blue-100' },
    { name: 'Viagem', color: 'amber-700' },
    { name: 'Investimento', color: 'gray-800' },
    { name: 'Outros', color: 'gray-200' },
    { name: 'Receitas', color: 'green-900' },
  ];

  // Parse the TSV file if it exists
  const rules: Record<string, string[]> = {};
  const rulesPath = path.join(__dirname, 'rules.tsv');
  const fileContent = fs.readFileSync(rulesPath, 'utf-8');
  const parseResult = Papa.parse<string[]>(fileContent, { delimiter: '\t' });
  for (const row of parseResult.data) {
    rules[row[0]] ||= [];
    rules[row[0]].push(row[1]);
  }

  // Then create new ones
  for (const category of categories) {
    const model = await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    await prisma.categoryRule.deleteMany({
      where: {
        userId: null,
        categoryId: model.id,
      },
    });
    const categoryRules = rules[category.name];
    if (!categoryRules?.length) continue;
    await prisma.categoryRule.createMany({
      data: categoryRules.map((keyword: string) => {
        return {
          keyword: keyword,
          categoryId: model.id,
        };
      }),
    });
  }

  // Create User
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@doe.com',
    },
  });

  // Create Account
  const account = await prisma.account.create({
    data: { userId: user.id, name: 'Nubank Credit Card', color: 'red-100', bankNumber: '260' },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
