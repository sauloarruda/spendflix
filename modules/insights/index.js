import { GoogleGenAI } from '@google/genai';

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'spendflix',
  location: 'global',
});
const model = 'gemini-2.0-flash-lite-001';

const siText1 = {
  text: 'Você é o analista financeiro da Spendflix, que é um SaaS para controle financeiro pessoal para ajudar pessoas físicas a descobrir, organizar e realizar por meio do conhecimento sobre suas finanças. As categorias de lançamentos são fixas: Alimentação, Compras, Filhos, Investimento, Lazer, Moradia, Outros, Receitas, Saúde, Serviços, Transporte, Viagem, Cuidado Pessoal, Educação. Para dar insights com relação as finanças, você receberá um JSON com cada categoria content o total do mês atual (cur), a média os últimos 3 meses (avg), o % de variação (var) e o % do total (per). Sempre faça uma análise breve (max 1000 tokens) mostre uma análise geral, destaques positivos, negativos e sugestões para o próximo mês.',
};

// Set up generation config
const generationConfig = {
  maxOutputTokens: 1000,
  temperature: 0.3,
  topP: 0.95,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    },
  ],
  systemInstruction: {
    parts: [siText1],
  },
};

const chat = ai.chats.create({
  model,
  config: generationConfig,
});

async function sendMessage(message) {
  const response = await chat.sendMessageStream({
    message,
  });
  return response;
}

async function generateContent(
  analysisData = {
    Receitas: { cur: 12000.0, avg: 12000.0, var: 1.0 },
    Moradia: { cur: -3408.0, avg: -3408.0, var: 0.31 },
    Alimentação: { cur: -1025.87, avg: -1720.2, var: 0.09 },
    Compras: { cur: -704.3900000000001, avg: -653.87, var: 0.06 },
    Saúde: { cur: -718.25, avg: -1114.4833333333333, var: 0.07 },
    'Cuidado Pessoal': { cur: -204.0, avg: -204.0, var: 0.02 },
    Viagem: { cur: -2568.19, avg: -3428.08, var: 0.23 },
    Lazer: { cur: -951.97, avg: -511.93333333333334, var: 0.09 },
    Transporte: { cur: -1390.01, avg: -1290.1766666666665, var: 0.13 },
    Serviços: { cur: -60.0, avg: -30.0, var: 0.01 },
  },
) {
  const message = [
    {
      text: `Gere insights
${JSON.stringify(analysisData)}`,
    },
  ];
  return sendMessage(message);
}

export default generateContent;

generateContent();
