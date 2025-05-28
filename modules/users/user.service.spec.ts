import { encrypt, decrypt } from '@/common/encryption';

import getPrisma from '../common/prisma';

import userService from './user.service';

jest.mock('../common/prisma');
jest.mock('@/common/encryption');

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  temporaryPassword: 'encrypted-temp',
};

describe('userService', () => {
  const mockFindMany = jest.fn();
  const mockUpdate = jest.fn();
  const mockCreate = jest.fn();
  const mockDelete = jest.fn();
  const mockFindFirstOrThrow = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getPrisma as jest.Mock).mockReturnValue({
      user: {
        findMany: mockFindMany,
        update: mockUpdate,
        create: mockCreate,
        delete: mockDelete,
        findFirstOrThrow: mockFindFirstOrThrow,
      },
    });
  });

  describe('findByEmail', () => {
    it('returns user if found', async () => {
      mockFindMany.mockResolvedValue([mockUser]);
      const user = await userService.findByEmail('test@example.com');
      expect(user).toEqual(mockUser);
      expect(mockFindMany).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
    it('returns undefined if not found', async () => {
      mockFindMany.mockResolvedValue([]);
      const user = await userService.findByEmail('notfound@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('startOnboarding', () => {
    it('creates user if not found', async () => {
      mockFindMany.mockResolvedValue([]);
      (encrypt as jest.Mock).mockReturnValue('encrypted-temp');
      mockCreate.mockResolvedValue({ ...mockUser });
      const user = await userService.startOnboarding('Test User', 'test@example.com');
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          temporaryPassword: 'encrypted-temp',
        }),
      });
      expect(user).toEqual(mockUser);
    });
    it('updates user if found but no temp password', async () => {
      mockFindMany.mockResolvedValue([{ ...mockUser, temporaryPassword: undefined }]);
      (encrypt as jest.Mock).mockReturnValue('encrypted-temp');
      mockUpdate.mockResolvedValue(mockUser);
      const user = await userService.startOnboarding('Test User', 'test@example.com');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          temporaryPassword: 'encrypted-temp',
        }),
      });
      expect(user).toEqual(mockUser);
    });
    it('returns user if found with temp password', async () => {
      mockFindMany.mockResolvedValue([mockUser]);
      const user = await userService.startOnboarding('Test User', 'test@example.com');
      expect(user).toEqual(mockUser);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getTempPassword', () => {
    it('returns decrypted temp password if exists', async () => {
      mockFindMany.mockResolvedValue([mockUser]);
      (decrypt as jest.Mock).mockReturnValue('decrypted-temp');
      const temp = await userService.getTempPassword('test@example.com');
      expect(temp).toBe('decrypted-temp');
      expect(decrypt).toHaveBeenCalledWith('encrypted-temp');
    });
    it('returns undefined if user not found', async () => {
      mockFindMany.mockResolvedValue([]);
      const temp = await userService.getTempPassword('notfound@example.com');
      expect(temp).toBeUndefined();
    });
    it('returns undefined if user has no temp password', async () => {
      mockFindMany.mockResolvedValue([{ ...mockUser, temporaryPassword: undefined }]);
      const temp = await userService.getTempPassword('test@example.com');
      expect(temp).toBeUndefined();
    });
  });

  describe('deleteTempPassword', () => {
    it('deletes user if found', async () => {
      mockFindMany.mockResolvedValue([mockUser]);
      mockDelete.mockResolvedValue(undefined);
      await userService.deleteTempPassword('test@example.com');
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });
    it('does nothing if user not found', async () => {
      mockFindMany.mockResolvedValue([]);
      await userService.deleteTempPassword('notfound@example.com');
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('upsertUser', () => {
    it('creates user if no id', async () => {
      mockCreate.mockResolvedValue(mockUser);
      const user = await userService.upsertUser({ name: 'Test User', email: 'test@example.com' });
      expect(mockCreate).toHaveBeenCalledWith({
        data: { name: 'Test User', email: 'test@example.com' },
      });
      expect(user).toEqual(mockUser);
    });
    it('updates user if id exists', async () => {
      mockUpdate.mockResolvedValue(mockUser);
      const user = await userService.upsertUser({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { id: 1, name: 'Test User', email: 'test@example.com' },
      });
      expect(user).toEqual(mockUser);
    });
  });

  describe('find', () => {
    it('returns user by id', async () => {
      mockFindFirstOrThrow.mockResolvedValue(mockUser);
      const user = await userService.find(1);
      expect(mockFindFirstOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(user).toEqual(mockUser);
    });
  });
});
