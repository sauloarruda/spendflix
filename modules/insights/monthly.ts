import getPrisma from '@/common/prisma';
import { GenerateContentConfig, GoogleGenAI, SendMessageParameters } from '@google/genai';

let aiClient: GoogleGenAI;

function getAi() {
  if (!aiClient) {
    // Initialize Vertex with your Cloud project and location
    aiClient = new GoogleGenAI({
      vertexai: true,
      project: 'spendflix',
      location: 'global',
    });
  }
  return aiClient;
}

const MODEL = 'gemini-2.0-flash-lite-001';
const SYSTEM_INSTRUCTIONS = {
  text: 'Você é o analista financeiro da Spendflix, que é um SaaS para controle financeiro pessoal para ajudar pessoas físicas a descobrir, organizar e realizar por meio do conhecimento sobre suas finanças. As categorias de lançamentos são fixas: Alimentação, Compras, Filhos, Investimento, Lazer, Moradia, Outros, Receitas, Saúde, Serviços, Transporte, Viagem, Cuidado Pessoal, Educação. Para dar insights com relação as finanças, você receberá um JSON com cada categoria content o total do mês atual (cur), a média os últimos 3 meses (avg), o % de variação (var) e o % do total (per). Sempre faça uma análise breve (max 1000 tokens) mostre uma análise geral, destaques positivos, negativos e sugestões para o próximo mês.',
};

// Set up generation config
const generationConfig: GenerateContentConfig = {
  maxOutputTokens: 1000,
  temperature: 0.3,
  topP: 0.95,
  systemInstruction: {
    parts: [SYSTEM_INSTRUCTIONS],
  },
};

async function sendMessage(message: SendMessageParameters) {
  const chat = getAi().chats.create({
    model: MODEL,
    config: generationConfig,
  });
  const response = await chat.sendMessageStream(message);
  return response;
}

type Transaction = {
  date: Date;
  amount: number;
  category?: { name: string } | null;
};

type CategoryAnalysis = {
  cur: number;
  avg: number;
  var: number;
  per: number;
};

export type MonthlyAnalisysData = Record<string, CategoryAnalysis>;

const AVG_MONTHS_COUNT = 3;

function getMonthYear(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

function groupTransactionsByMonthAndCategory(txs: Transaction[]) {
  const months: Record<string, { income: number; outcome: number }> = {};
  const txsWithMonthCat = txs.map((tx) => {
    const month = getMonthYear(tx.date);
    const cat = tx.category?.name || 'Sem Categoria';
    if (!months[month]) months[month] = { income: 0, outcome: 0 };
    if (tx.amount < 0) {
      months[month].outcome += tx.amount;
    } else {
      months[month].income += tx.amount;
    }
    return { ...tx, month, cat };
  });
  return { months, txsWithMonthCat };
}

function groupByMonthCat(txsWithMonthCat: (Transaction & { month: string; cat: string })[]) {
  const txsByMonthCat: Record<string, (Transaction & { month: string; cat: string })[]> = {};
  txsWithMonthCat.forEach((tx) => {
    const key = `${tx.month}-${tx.cat}`;
    if (!txsByMonthCat[key]) txsByMonthCat[key] = [];
    txsByMonthCat[key].push(tx);
  });
  return txsByMonthCat;
}

function finalizeAnalysisData(analysisData: MonthlyAnalisysData): MonthlyAnalisysData {
  const result: MonthlyAnalisysData = {};
  Object.entries(analysisData).forEach(([cat, data]) => {
    const avg = +(data.avg / AVG_MONTHS_COUNT).toFixed(2);
    const { cur } = data;
    result[cat] = {
      ...data,
      avg,
      var: avg !== 0 ? +((cur - avg) / avg).toFixed(2) : 0,
    };
  });
  return result;
}

function getRelevantMonths(months: Record<string, { income: number; outcome: number }>): string[] {
  const sortedMonths = Object.keys(months).sort().reverse();
  const lastMonth = sortedMonths[0];
  const prevMonths = sortedMonths.slice(1, 1 + AVG_MONTHS_COUNT);
  return [lastMonth, ...prevMonths];
}

interface IProcessMonthCatEntryParams {
  key: string;
  txsArr: (Transaction & { month: string; cat: string })[];
  analysisData: MonthlyAnalisysData;
  months: Record<string, { income: number; outcome: number }>;
  relevantMonths: string[];
}

function getTransactionSum(txsArr: (Transaction & { month: string; cat: string })[]): number {
  return txsArr.reduce((acc, tx) => acc + tx.amount, 0);
}

interface IUpdateCategoryAnalysisParams {
  cat: string;
  month: string;
  sum: number;
  data: CategoryAnalysis;
  months: Record<string, { income: number; outcome: number }>;
  relevantMonths: string[];
}

interface IUpdatedCategoryForCurrentMonthParams {
  cat: string;
  sum: number;
  data: CategoryAnalysis;
  months: Record<string, { income: number; outcome: number }>;
  month: string;
}

function getUpdatedCategoryForCurrentMonth({
  cat,
  sum,
  data,
  months,
  month,
}: IUpdatedCategoryForCurrentMonthParams): CategoryAnalysis {
  const total = cat === 'Receitas' ? months[month].income : Math.abs(months[month].outcome);
  return {
    ...data,
    cur: sum,
    per: total !== 0 ? +(sum / total).toFixed(2) : 0,
  };
}

function getUpdatedCategoryForPrevMonth(data: CategoryAnalysis, sum: number): CategoryAnalysis {
  return {
    ...data,
    avg: data.avg + sum,
  };
}

function updateCategoryAnalysis({
  cat,
  month,
  sum,
  data,
  months,
  relevantMonths,
}: IUpdateCategoryAnalysisParams): CategoryAnalysis {
  if (month === relevantMonths[0]) {
    return getUpdatedCategoryForCurrentMonth({
      cat, sum, data, months, month,
    });
  }
  return getUpdatedCategoryForPrevMonth(data, sum);
}

interface IGetUpdatedCatParams {
  cat: string;
  month: string;
  sum: number;
  analysisData: MonthlyAnalisysData;
  months: Record<string, { income: number; outcome: number }>;
  relevantMonths: string[];
}

function getUpdatedCat({
  cat,
  month,
  sum,
  analysisData,
  months,
  relevantMonths,
}: IGetUpdatedCatParams): CategoryAnalysis {
  const prevData = analysisData[cat] || {
    cur: 0, avg: 0, var: 0, per: 0,
  };
  return updateCategoryAnalysis({
    cat, month, sum, data: prevData, months, relevantMonths,
  });
}

function processMonthCatEntry({
  key,
  txsArr,
  analysisData,
  months,
  relevantMonths,
}: IProcessMonthCatEntryParams): MonthlyAnalisysData {
  const [month, cat] = key.split('-');
  if (!relevantMonths.includes(month)) return analysisData;
  const sum = getTransactionSum(txsArr);
  const updatedCat = getUpdatedCat({
    cat, month, sum, analysisData, months, relevantMonths,
  });
  return { ...analysisData, [cat]: updatedCat };
}

function processMonthCatEntries(
  txsByMonthCat: Record<string, (Transaction & { month: string; cat: string })[]>,
  months: Record<string, { income: number; outcome: number }>,
  relevantMonths: string[],
): MonthlyAnalisysData {
  let analysisData: MonthlyAnalisysData = {};
  Object.entries(txsByMonthCat).forEach(([key, txsArr]) => {
    analysisData = processMonthCatEntry({
      key, txsArr, analysisData, months, relevantMonths,
    });
  });
  return analysisData;
}

function buildAnalysisDataFromGroups(
  txsByMonthCat: Record<string, (Transaction & { month: string; cat: string })[]>,
  months: Record<string, { income: number; outcome: number }>,
  relevantMonths: string[],
): MonthlyAnalisysData {
  const analysisData = processMonthCatEntries(txsByMonthCat, months, relevantMonths);
  return finalizeAnalysisData(analysisData);
}

async function fetchTransactions(userId: number) {
  return getPrisma().transaction.findMany({
    select: {
      date: true,
      amount: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    where: {
      account: { userId },
    },
  });
}

async function buildAnalisysData(userId: number): Promise<MonthlyAnalisysData> {
  const txs: Transaction[] = await fetchTransactions(userId);
  const { months, txsWithMonthCat } = groupTransactionsByMonthAndCategory(txs);
  const relevantMonths = getRelevantMonths(months);
  const txsByMonthCat = groupByMonthCat(txsWithMonthCat);
  return buildAnalysisDataFromGroups(txsByMonthCat, months, relevantMonths);
}

async function monthly(userId: number) {
  const analysisData = await buildAnalisysData(userId);
  const message: SendMessageParameters = {
    message: `Gere insights ${JSON.stringify(analysisData)}`,
  };
  return sendMessage(message);
}

export default monthly;
