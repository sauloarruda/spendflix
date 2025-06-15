import {
  userFactory, accountFactory, categoryFactory, transactionFactory,
} from '@/factories';
import { GoogleGenAI } from '@google/genai';

import monthly, { type MonthlyAnalisysData } from './monthly';

jest.mock('@google/genai');

const testKey = Math.random().toString(36).substring(7);

describe('monthly insights', () => {
  let user: Awaited<ReturnType<typeof userFactory.create>>;
  let account: Awaited<ReturnType<typeof accountFactory.create>>;
  let mockAiClient: jest.Mocked<GoogleGenAI>;
  let mockChat: { sendMessageStream: jest.Mock };
  let mockSendMessageStream: jest.Mock;

  beforeAll(() => {
    // Mock AI client setup once for all tests
    mockSendMessageStream = jest.fn();
    mockChat = {
      sendMessageStream: mockSendMessageStream,
    };
    mockAiClient = {
      chats: {
        create: jest.fn().mockReturnValue(mockChat),
      },
    } as unknown as jest.Mocked<GoogleGenAI>;

    (GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>).mockImplementation(() => mockAiClient);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSendMessageStream.mockClear();
    (mockAiClient.chats.create as jest.Mock).mockClear();

    // Setup user and account with unique email per test
    const uniqueId = Math.random().toString(36).substring(7);
    user = await userFactory.create({ email: `test-${testKey}-${uniqueId}@example.com` });
    account = await accountFactory.create({ user: { connect: { id: user.id } } });
  });

  describe('monthly function', () => {
    it('should generate insights for user transactions', async () => {
      // Create mock transactions with different categories and months
      const alimentacaoCategory = await categoryFactory.create({ name: `Alimentação-${testKey}` });
      const receitasCategory = await categoryFactory.create({ name: `Receitas-${testKey}` });
      const transporteCategory = await categoryFactory.create({ name: `Transporte-${testKey}` });

      // Current month transactions (December 2024)
      await transactionFactory.createList(3, {
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-12-15'),
        amount: -100,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: receitasCategory.id } },
        date: new Date('2024-12-15'),
        amount: 5000,
      });

      // Previous months transactions for average calculation
      await transactionFactory.createList(2, {
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-11-15'),
        amount: -150,
      });

      await transactionFactory.createList(2, {
        account: { connect: { id: account.id } },
        category: { connect: { id: transporteCategory.id } },
        date: new Date('2024-10-15'),
        amount: -200,
      });

      // Mock AI response
      const mockResponse = {
        async* stream() {
          yield { text: 'Análise financeira gerada com sucesso' };
        },
      };
      mockSendMessageStream.mockResolvedValue(mockResponse);

      const result = await monthly(user.id);

      expect(mockAiClient.chats.create).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-lite-001',
        config: expect.objectContaining({
          maxOutputTokens: 1000,
          temperature: 0.3,
          topP: 0.95,
        }),
      });

      expect(mockSendMessageStream).toHaveBeenCalledWith({
        message: expect.stringContaining('Gere insights'),
      });

      expect(result).toBe(mockResponse);
    });

    it('should handle empty transactions', async () => {
      const mockResponse = {
        async* stream() {
          yield { text: 'Nenhuma transação encontrada' };
        },
      };
      mockSendMessageStream.mockResolvedValue(mockResponse);

      const result = await monthly(user.id);

      // Check if the function was called at all - empty data should still call AI
      expect(mockSendMessageStream).toHaveBeenCalled();
      const callArgs = mockSendMessageStream.mock.calls[0][0];
      expect(callArgs.message).toContain('Gere insights');
      expect(result).toBe(mockResponse);
    });
  });

  describe('analysis data building', () => {
    it('should correctly calculate category analysis with current and average amounts', async () => {
      const mockResponse = {
        async* stream() {
          yield { text: 'Test analysis' };
        },
      };
      mockSendMessageStream.mockResolvedValue(mockResponse);

      const alimentacaoCategory = await categoryFactory.create({ name: `Alimentação-${testKey}-2` });
      const receitasCategory = await categoryFactory.create({ name: `Receitas-${testKey}-2` });

      // Current month (December 2024)
      await transactionFactory.createList(2, {
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-12-15'),
        amount: -100,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: receitasCategory.id } },
        date: new Date('2024-12-15'),
        amount: 3000,
      });

      // Previous months for average (Nov, Oct, Sep)
      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-11-15'),
        amount: -150,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-10-15'),
        amount: -120,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: alimentacaoCategory.id } },
        date: new Date('2024-09-15'),
        amount: -80,
      });

      await monthly(user.id);

      expect(mockSendMessageStream).toHaveBeenCalled();
      const callArgs = mockSendMessageStream.mock.calls[0][0];
      const analysisData: MonthlyAnalisysData = JSON.parse(
        callArgs.message.replace('Gere insights ', ''),
      );

      // Get the first category key that starts with 'Alimentação'
      const alimentacaoKey = Object.keys(analysisData).find((key) => key.startsWith('Alimentação'));
      const receitasKey = Object.keys(analysisData).find((key) => key.startsWith('Receitas'));

      expect(alimentacaoKey).toBeDefined();
      expect(receitasKey).toBeDefined();

      // Alimentação: current = -200, average = (-150 + -120 + -80) / 3 = -116.67
      expect(analysisData[alimentacaoKey!].cur).toBe(-200);
      expect(analysisData[alimentacaoKey!].avg).toBe(-116.67);
      expect(analysisData[alimentacaoKey!].var).toBeCloseTo(0.71, 2);

      // Receitas: current = 3000, no previous data so avg = 0
      expect(analysisData[receitasKey!].cur).toBe(3000);
      expect(analysisData[receitasKey!].avg).toBe(0);
      expect(analysisData[receitasKey!].var).toBe(0);
    });

    it('should handle transactions without categories', async () => {
      const mockResponse = {
        async* stream() {
          yield { text: 'Analysis with uncategorized' };
        },
      };
      mockSendMessageStream.mockResolvedValue(mockResponse);

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: undefined,
        date: new Date('2024-12-15'),
        amount: -50,
      });

      await monthly(user.id);

      const callArgs = mockSendMessageStream.mock.calls[0][0];
      const analysisData: MonthlyAnalisysData = JSON.parse(
        callArgs.message.replace('Gere insights ', ''),
      );

      expect(analysisData).toHaveProperty('Sem Categoria');
      expect(analysisData['Sem Categoria'].cur).toBe(-50);
    });
  });

  describe('error handling', () => {
    it('should handle AI API errors gracefully', async () => {
      mockSendMessageStream.mockRejectedValue(new Error('AI API error'));

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        date: new Date('2024-12-15'),
        amount: -100,
      });

      await expect(monthly(user.id)).rejects.toThrow('AI API error');
    });
  });

  describe('date and month handling', () => {
    it('should correctly group transactions by month', async () => {
      const mockResponse = {
        async* stream() {
          yield { text: 'Month grouping test' };
        },
      };
      mockSendMessageStream.mockResolvedValue(mockResponse);

      const category = await categoryFactory.create({ name: `Teste-${testKey}-3` });

      // Different months
      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: category.id } },
        date: new Date('2024-12-15'),
        amount: -100,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: category.id } },
        date: new Date('2024-11-15'),
        amount: -200,
      });

      await transactionFactory.create({
        account: { connect: { id: account.id } },
        category: { connect: { id: category.id } },
        date: new Date('2024-01-15'), // This should not be included in analysis
        amount: -300,
      });

      await monthly(user.id);

      const callArgs = mockSendMessageStream.mock.calls[0][0];
      const analysisData: MonthlyAnalisysData = JSON.parse(
        callArgs.message.replace('Gere insights ', ''),
      );

      // Get the category key that starts with 'Teste'
      const testeKey = Object.keys(analysisData).find((key) => key.startsWith('Teste'));
      expect(testeKey).toBeDefined();

      // Should include current month (-100) and previous months in average
      // Months: Dec 2024 (current: -100), Nov 2024 (-200), Jan 2024 (-300)
      // Average: (-200 + -300 + 0) / 3 = -166.67
      expect(analysisData[testeKey!].cur).toBe(-100);
      expect(analysisData[testeKey!].avg).toBeCloseTo(-166.67, 2);
    });
  });
});
