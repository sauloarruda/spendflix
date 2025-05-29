import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';

import getPrisma from '../common/prisma';

import cognito from './cognito';
import signupService from './signup.service';
import userService from './user.service';

jest.mock('./user.service');
jest.mock('./cognito');
jest.mock('../common/prisma');
jest.mock('@/common/encryption', () => ({
  decrypt: jest.fn(() => 'decrypted-temp'),
}));

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  temporaryPassword: 'encrypted-temp',
};

describe('Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userService.startOnboarding as jest.Mock).mockResolvedValue(mockUser);
    (userService.deleteTempPassword as jest.Mock).mockResolvedValue(undefined);
    (userService.getTempPassword as jest.Mock).mockResolvedValue('temp-pass');
    (userService.find as jest.Mock).mockResolvedValue({
      ...mockUser,
      temporaryPassword: 'encrypted-temp',
    });
    (cognito.signUpCommand as jest.Mock).mockResolvedValue({
      User: { Username: 'mocked-user-id' },
    });
    (cognito.getUserStatus as jest.Mock).mockResolvedValue({ UserStatus: 'CONFIRMED' });
    (cognito.resendConfirmation as jest.Mock).mockResolvedValue(undefined);
    (cognito.confirmSignUp as jest.Mock).mockResolvedValue(undefined);
    (cognito.initiateAuth as jest.Mock).mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'a',
        RefreshToken: 'r',
        IdToken: 'i',
        ExpiresIn: 123,
      },
    });
    (getPrisma as jest.Mock).mockReturnValue({
      user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
    });
  });

  it('should call Cognito and create user', async () => {
    const res = await signupService.signup('Test User', 'test@example.com');
    expect(res.id).toBe(mockUser.id);
    expect(userService.startOnboarding).toHaveBeenCalledWith('Test User', 'test@example.com');
    expect(cognito.signUpCommand).toHaveBeenCalledWith(mockUser);
  });

  it('should handle UsernameExistsException with CONFIRMED user', async () => {
    (cognito.signUpCommand as jest.Mock).mockRejectedValue(
      new UsernameExistsException({ message: 'exists', $metadata: { httpStatusCode: 400 } }),
    );
    (cognito.getUserStatus as jest.Mock).mockResolvedValue({ UserStatus: 'CONFIRMED' });
    await expect(signupService.signup('Test User', 'test@example.com')).rejects.toThrow(
      UsernameExistsException,
    );
    expect(cognito.getUserStatus).toHaveBeenCalled();
  });

  it('should handle UsernameExistsException with UNCONFIRMED user', async () => {
    (cognito.signUpCommand as jest.Mock).mockRejectedValue(
      new UsernameExistsException({ message: 'exists', $metadata: { httpStatusCode: 400 } }),
    );
    (cognito.getUserStatus as jest.Mock).mockResolvedValue({ UserStatus: 'UNCONFIRMED' });
    const res = await signupService.signup('Test User', 'test@example.com');
    expect(cognito.resendConfirmation).toHaveBeenCalledWith('test@example.com');
    expect(res).toEqual(mockUser);
  });

  it('should handle UsernameExistsException with unknown status', async () => {
    (cognito.signUpCommand as jest.Mock).mockRejectedValue(
      new UsernameExistsException({ message: 'exists', $metadata: { httpStatusCode: 400 } }),
    );
    (cognito.getUserStatus as jest.Mock).mockResolvedValue({ UserStatus: 'OTHER' });
    await expect(signupService.signup('Test User', 'test@example.com')).rejects.toThrow();
    expect(userService.deleteTempPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle generic error in signup', async () => {
    (userService.startOnboarding as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(signupService.signup('Test User', 'test@example.com')).rejects.toThrow('fail');
  });

  describe('confirm', () => {
    it('should confirm user and return tokens', async () => {
      (userService.getTempPassword as jest.Mock).mockResolvedValue('temp-pass');
      (cognito.confirmSignUp as jest.Mock).mockResolvedValue(undefined);
      (cognito.initiateAuth as jest.Mock).mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'a',
          RefreshToken: 'r',
          IdToken: 'i',
          ExpiresIn: 123,
        },
      });
      (getPrisma as jest.Mock).mockReturnValue({
        user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
      });
      const res = await signupService.confirm('test@example.com', 'code');
      expect(res.user).toEqual(mockUser);
      expect(res.tokens).toMatchObject({
        accessToken: 'a',
        refreshToken: 'r',
        idToken: 'i',
        expiresIn: 123,
        sub: '',
      });
    });

    it('should throw if user not found', async () => {
      (getPrisma as jest.Mock).mockReturnValue({
        user: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      await expect(signupService.confirm('notfound@example.com', 'code')).rejects.toThrow(
        'User not found for email: notfound@example.com',
      );
    });

    it('should throw if no pending signup for email', async () => {
      (userService.getTempPassword as jest.Mock).mockResolvedValue(undefined);
      (getPrisma as jest.Mock).mockReturnValue({
        user: { findUnique: jest.fn().mockResolvedValue(mockUser) },
      });
      await expect(signupService.confirm('test@example.com', 'code')).rejects.toThrow(
        'No pending signup for this email',
      );
    });

    it('should propagate errors from Cognito confirmSignUp', async () => {
      (cognito.confirmSignUp as jest.Mock).mockRejectedValue(new Error('cognito error'));
      await expect(signupService.confirm('test@example.com', 'code')).rejects.toThrow(
        'cognito error',
      );
    });
  });

  describe('findUser', () => {
    it('should find and decrypt user', async () => {
      (userService.find as jest.Mock).mockResolvedValue({
        ...mockUser,
        temporaryPassword: 'encrypted-temp',
      });
      const res = await signupService.findUser(1);
      expect(res.id).toBe(1);
      expect(res.temporaryPassword).toBeDefined();
    });
  });
});
