import crypto from 'crypto';

import getPrisma from '@/common/prisma';
import { GenerateContentConfig, GoogleGenAI, SendMessageParameters } from '@google/genai';

import AiResponseStream from './AiResponseStream';

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

async function sendMessage(messageText: string) {
  const message: SendMessageParameters = {
    message: messageText,
  };

  const chat = getAi().chats.create({
    model: MODEL,
    config: generationConfig,
  });
  return new AiResponseStream(await chat.sendMessageStream(message));
}

function generateIdentifier(userId: number, config: string) {
  return crypto.createHash('sha256').update(`${userId}-${config}`).digest('hex');
}

async function getInsight(userId: number, identifier: string) {
  return getPrisma().insight.findUnique({
    where: { identifier },
  });
}

function buildConfig(messageText: string) {
  return {
    month: [new Date().getFullYear(), new Date().getMonth()].join('-'),
    message: messageText,
  };
}

// eslint-disable-next-line max-params
async function saveInsight(
  userId: number,
  identifier: string,
  config: Record<string, string>,
  responseText: string,
) {
  await getPrisma().insight.create({
    data: {
      userId,
      identifier,
      config,
      text: responseText,
    },
  });
}
async function streamInsight(userId: number, messageText: string) {
  const config = buildConfig(messageText);
  const identifier = generateIdentifier(userId, JSON.stringify(config));
  const insight = await getInsight(userId, identifier);
  if (insight) return new AiResponseStream(insight.text);

  const stream = await sendMessage(messageText);
  stream.onEnd((responseText) => saveInsight(userId, identifier, config, responseText));
  return stream;
}

const insightsService = {
  streamInsight,
};

export default insightsService;
