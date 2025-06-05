import fs from 'fs';
import path from 'path';
import readline from 'readline';

import Papa from 'papaparse';

// import { generateTransactionsForPersona } from './lib/generate';

type Persona = {
  persona: string;
  category: string;
  type: string;
  frequency: string;
  ocorrency: string;
  organization: string;
  variation_type: 'fixed' | 'variable';
  percentage_total: string;
  income?: string;
  outcome?: string;
};

type Company = {
  name: string;
  organization: string;
};

function readCSV<T = any>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const csvData = fs.readFileSync(filePath, 'utf8');
    Papa.parse<T>(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err: unknown) => reject(err),
    });
  });
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const personas = await readCSV<Persona>(path.resolve(__dirname, './data/personas.csv'));
  const companies = await readCSV<Company>(path.resolve(__dirname, './data/companies.csv'));

  const personaNames = [...new Set(personas.map((p) => p.persona))];
  console.log('\n👤 Personas disponíveis:');
  personaNames.forEach((name, index) => console.log(`${index + 1}. ${name}`));

  const index = parseInt(await askQuestion('\nDigite o número da persona que deseja gerar: '), 10);
  const selected = personaNames[index - 1];
  if (!selected) return console.error('❌ Persona inválida.');

  const selectedPersona = personas.filter((p) => p.persona === selected);
  console.log(`\n🎯 Gerando transações para: ${selected}\n`);

  // await generateTransactionsForPersona(selectedPersona, companies);
}

main();
