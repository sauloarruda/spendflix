import getPrisma from '../common/prisma';

import onboardingService, { OnboardingData } from './onboarding.service';

jest.mock('../common/prisma');

const mockFindFirstOrThrow = jest.fn();
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getPrisma as jest.Mock).mockReturnValue({
    onboarding: {
      findFirstOrThrow: mockFindFirstOrThrow,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
  });
});

describe('onboardingRepository', () => {
  describe('find', () => {
    it('returns onboarding if found', async () => {
      const onboarding = { id: '1', data: {} };
      mockFindFirstOrThrow.mockResolvedValue(onboarding);
      const result = await onboardingService.find('1');
      expect(result).toEqual(onboarding);
      expect(mockFindFirstOrThrow).toHaveBeenCalledWith({ where: { id: '1' } });
    });
    it('throws if not found', async () => {
      mockFindFirstOrThrow.mockRejectedValue(new Error('Not found'));
      await expect(onboardingService.find('2')).rejects.toThrow('Not found');
    });
  });

  describe('findByEmail', () => {
    it('returns onboarding if found', async () => {
      const onboarding = { id: '1', data: {}, user: { email: 'test@example.com' } };
      mockFindFirst.mockResolvedValue(onboarding);
      const result = await onboardingService.findByEmail('test@example.com');
      expect(result).toEqual(onboarding);
      expect(mockFindFirst).toHaveBeenCalledWith({
        include: { user: true },
        where: { user: { email: 'test@example.com' } },
      });
    });
    it('returns null if not found', async () => {
      mockFindFirst.mockResolvedValue(null);
      const result = await onboardingService.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates onboarding with step 0', async () => {
      const onboarding = { id: '1', data: { step: 0 } };
      mockCreate.mockResolvedValue(onboarding);
      const result = await onboardingService.create();
      expect(result).toEqual(onboarding);
      expect(mockCreate).toHaveBeenCalledWith({ data: { data: { step: 0 } } });
    });
  });

  describe('update', () => {
    it('updates onboarding data and userId', async () => {
      const onboarding = { id: '1', data: { step: 1, name: 'Test' } };
      mockFindFirstOrThrow.mockResolvedValue(onboarding);
      mockUpdate.mockResolvedValue(undefined);
      const newData: Partial<OnboardingData> = { step: 2, goal: 'dream' };
      await onboardingService.update('1', newData, 123);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { data: { step: 2, name: 'Test', goal: 'dream' }, userId: 123 },
      });
    });
    it('updates onboarding data without userId', async () => {
      const onboarding = { id: '1', data: { step: 1, name: 'Test' } };
      mockFindFirstOrThrow.mockResolvedValue(onboarding);
      mockUpdate.mockResolvedValue(undefined);
      const newData: Partial<OnboardingData> = { step: 3 };
      await onboardingService.update('1', newData, undefined);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { data: { step: 3, name: 'Test' } },
      });
    });
    it('throws if onboarding not found', async () => {
      mockFindFirstOrThrow.mockRejectedValue(new Error('Not found'));
      await expect(onboardingService.update('2', { step: 1 }, 1)).rejects.toThrow('Not found');
    });
  });
});
