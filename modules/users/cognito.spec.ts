import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminGetUserCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import cognito from './cognito';

jest.mock('@/common/config', () => () => ({
  COGNITO_CLIENT_ID: 'test-client-id',
  COGNITO_USER_POOL_ID: 'test-user-pool-id',
  COGNITO_ENDPOINT: 'http://localhost:9229',
}));

jest.mock('@/common/encryption', () => ({
  decrypt: jest.fn((pw) => pw ?? 'decrypted-password'),
}));

jest.mock('@/common/logger', () => () => ({
  child: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  }),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('cognito module', () => {
  const mockSend = jest.fn();
  beforeAll(() => {
    CognitoIdentityProviderClient.prototype.send = mockSend;
  });
  beforeEach(() => {
    mockSend.mockReset();
  });

  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    temporaryPassword: 'temp-pass',
    cognitoId: 'cognito-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    onboardings: [],
    accounts: [],
  };

  it('signUpCommand calls Cognito SignUpCommand', async () => {
    mockSend.mockResolvedValue({ userSub: 'mocked-user-id' });
    const res = await cognito.signUpCommand(user);
    expect(mockSend).toHaveBeenCalledWith(expect.any(SignUpCommand));
    expect(res).toEqual({ userSub: 'mocked-user-id' });
  });

  it('getUserStatus calls Cognito AdminGetUserCommand', async () => {
    mockSend.mockResolvedValue({ Username: user.email });
    const res = await cognito.getUserStatus(user.email);
    expect(mockSend).toHaveBeenCalledWith(expect.any(AdminGetUserCommand));
    expect(res).toEqual({ Username: user.email });
  });

  it('getUserFromToken calls Cognito GetUserCommand', async () => {
    mockSend.mockResolvedValue({ Username: user.email });
    const res = await cognito.getUserFromToken('access-token');
    expect(mockSend).toHaveBeenCalledWith(expect.any(GetUserCommand));
    expect(res).toEqual({ Username: user.email });
  });

  it('resendConfirmation calls Cognito ResendConfirmationCodeCommand', async () => {
    mockSend.mockResolvedValue({});
    await cognito.resendConfirmation(user.email);
    expect(mockSend).toHaveBeenCalledWith(expect.any(ResendConfirmationCodeCommand));
  });

  it('initiateAuth calls Cognito InitiateAuthCommand', async () => {
    mockSend.mockResolvedValue({ AuthenticationResult: { AccessToken: 'token' } });
    const res = await cognito.initiateAuth(user.email, 'password');
    expect(mockSend).toHaveBeenCalledWith(expect.any(InitiateAuthCommand));
    expect(res).toEqual({ AuthenticationResult: { AccessToken: 'token' } });
  });

  it('confirmSignUp calls Cognito ConfirmSignUpCommand', async () => {
    mockSend.mockResolvedValue({});
    await cognito.confirmSignUp(user.email, '123456');
    expect(mockSend).toHaveBeenCalledWith(expect.any(ConfirmSignUpCommand));
  });

  it('forgotPassword calls Cognito ForgotPasswordCommand', async () => {
    mockSend.mockResolvedValue({});
    await cognito.forgotPassword(user.email);
    expect(mockSend).toHaveBeenCalledWith(expect.any(ForgotPasswordCommand));
  });

  it('resetPassword calls Cognito ConfirmForgotPasswordCommand', async () => {
    mockSend.mockResolvedValue({});
    await cognito.resetPassword(user.email, '123456', 'new-password');
    expect(mockSend).toHaveBeenCalledWith(expect.any(ConfirmForgotPasswordCommand));
  });
});
