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
    { name: 'Alimentação', color: 'indigo-500' },
    { name: 'Compras', color: 'red-500' },
    { name: 'Filhos', color: 'yellow-600' },
    { name: 'Investimento', color: 'gray-800' },
    { name: 'Lazer', color: 'cyan-800' },
    { name: 'Moradia', color: 'indigo-800' },
    { name: 'Outros', color: 'gray-600' },
    { name: 'Receitas', color: 'green-900' },
    { name: 'Saúde', color: 'teal-700' },
    { name: 'Serviços', color: 'orange-400' },
    { name: 'Transporte', color: 'purple-600' },
    { name: 'Viagem', color: 'teal-500' },
    { name: 'Cuidado Pessoal', color: 'pink-400' },
    { name: 'Educação', color: 'purple-300' },
  ];

  // Parse the TSV file if it exists
  const rules: Record<string, string[]> = {};
  const rulesPath = path.join(__dirname, 'rules.tsv');
  const fileContent = fs.readFileSync(rulesPath, 'utf-8');
  const parseResult = Papa.parse<string[]>(fileContent, { delimiter: '\t' });
  for (const row of parseResult.data) {
    rules[row[0]] ??= [];
    rules[row[0]].push(row[1]);
  }

  // Then create new ones
  for (const category of categories) {
    const model = await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    const categoryRules = rules[category.name];
    if (!categoryRules?.length) continue;
    await Promise.all(
      categoryRules.map(async (keyword: string) => {
        const rule = {
          keyword: keyword,
          categoryId: model.id,
          accountId: null,
        };
        if (!(await prisma.categoryRule.findFirst({ where: rule }))) {
          return prisma.categoryRule.create({ data: rule });
        }
      }),
    );
  }

  // Create User
  const email = 'john@doe.com';
  if (!(await prisma.user.findFirst({ where: { email: email } }))) {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: email,
      },
    });

    // Create Account
    const account = await prisma.account.create({
      data: { userId: user.id, name: 'Nubank Credit Card', color: 'red-100', bankNumber: '260' },
    });
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
