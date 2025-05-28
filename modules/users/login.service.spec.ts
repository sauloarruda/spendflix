import cognito from './cognito';
import loginService from './login.service';
import userService from './user.service';
import { UserTokens } from './userTokens';

jest.mock('./cognito');
jest.mock('./user.service');

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  cognitoId: 'cognito-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('loginService', () => {
  const mockAuthResult = {
    AccessToken: 'access-token',
    RefreshToken: 'refresh-token',
    IdToken: 'id-token',
    ExpiresIn: 1234,
  };
  const mockCognitoUser = {
    UserAttributes: [
      { Name: 'sub', Value: 'cognito-id' },
      { Name: 'name', Value: 'Test User' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate and return tokens', async () => {
      (cognito.initiateAuth as jest.Mock).mockResolvedValue({
        AuthenticationResult: mockAuthResult,
      });
      (cognito.getUserFromToken as jest.Mock).mockResolvedValue(mockCognitoUser);
      (userService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        cognitoId: 'cognito-id',
      });
      (userService.upsertUser as jest.Mock).mockResolvedValue(mockUser);

      const tokens: UserTokens = await loginService.login('test@example.com', 'password');
      expect(tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresIn: 1234,
        sub: '1',
      });
      expect(cognito.initiateAuth).toHaveBeenCalledWith('test@example.com', 'password');
      expect(cognito.getUserFromToken).toHaveBeenCalledWith('access-token');
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should upsert user if not found or cognitoId mismatch', async () => {
      (cognito.initiateAuth as jest.Mock).mockResolvedValue({
        AuthenticationResult: mockAuthResult,
      });
      (cognito.getUserFromToken as jest.Mock).mockResolvedValue(mockCognitoUser);
      (userService.findByEmail as jest.Mock).mockResolvedValueOnce(undefined);
      (userService.upsertUser as jest.Mock).mockResolvedValue(mockUser);

      await loginService.login('test@example.com', 'password');
      expect(userService.upsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          cognitoId: 'cognito-id',
        }),
      );
    });

    it('should use default expiresIn if not returned by Cognito', async () => {
      (cognito.initiateAuth as jest.Mock).mockResolvedValue({
        AuthenticationResult: { ...mockAuthResult, ExpiresIn: undefined },
      });
      (cognito.getUserFromToken as jest.Mock).mockResolvedValue(mockCognitoUser);
      (userService.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        cognitoId: 'cognito-id',
      });
      (userService.upsertUser as jest.Mock).mockResolvedValue(mockUser);

      const tokens: UserTokens = await loginService.login('test@example.com', 'password');
      expect(tokens.expiresIn).toBe(3600);
    });

    it('should throw if Cognito fails', async () => {
      (cognito.initiateAuth as jest.Mock).mockRejectedValue(new Error('Auth failed'));
      await expect(loginService.login('test@example.com', 'password')).rejects.toThrow(
        'Auth failed',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should call cognito.forgotPassword', async () => {
      (cognito.forgotPassword as jest.Mock).mockResolvedValue(undefined);
      await loginService.forgotPassword('test@example.com');
      expect(cognito.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });
    it('should propagate errors from cognito.forgotPassword', async () => {
      (cognito.forgotPassword as jest.Mock).mockRejectedValue(new Error('Forgot error'));
      await expect(loginService.forgotPassword('test@example.com')).rejects.toThrow('Forgot error');
    });
  });

  describe('resetPassword', () => {
    it('should call cognito.resetPassword', async () => {
      (cognito.resetPassword as jest.Mock).mockResolvedValue(undefined);
      await loginService.resetPassword('test@example.com', 'code', 'newpass');
      expect(cognito.resetPassword).toHaveBeenCalledWith('test@example.com', 'code', 'newpass');
    });
    it('should propagate errors from cognito.resetPassword', async () => {
      (cognito.resetPassword as jest.Mock).mockRejectedValue(new Error('Reset error'));
      await expect(
        loginService.resetPassword('test@example.com', 'code', 'newpass'),
      ).rejects.toThrow('Reset error');
    });
  });
});
