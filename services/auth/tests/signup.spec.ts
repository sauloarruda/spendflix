import request from 'supertest';
import {
  CognitoIdentityProviderClient,
  InternalErrorException,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import createApp from '../src/app';
import { encrypt } from '../lib/encryption';

process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
process.env.ENCRYPTION_SECRET = 'test-secret-key-1234567890123456789012';

const mockCognitoUsernameExistsException = (userStatus: string) => {
  const mockedCognito = jest
    .fn()
    .mockRejectedValueOnce(
      new UsernameExistsException({
        message: 'User already exists',
        $metadata: { httpStatusCode: 400 },
      }),
    )
    .mockResolvedValueOnce({ UserStatus: userStatus });

  if (userStatus === 'UNCONFIRMED') {
    mockedCognito.mockResolvedValueOnce({});
  }

  CognitoIdentityProviderClient.prototype.send = mockedCognito;
  return mockedCognito;
};

describe('POST /auth/signup', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name or email is missing', async () => {
    let res = await request(app).post('/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'name'");

    res = await request(app).post('/auth/signup').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
  });

  it('should call Cognito and return 201 on success', async () => {
    const mockedCognito = jest.fn().mockResolvedValue({ User: { Username: 'mocked-user-id' } });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(201);

    expect(mockedCognito).toHaveBeenCalled();
  });

  it('should return 400 when user is already confirmed', async () => {
    const mockedCognito = mockCognitoUsernameExistsException('CONFIRMED');

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'UsernameExistsException');
    expect(mockedCognito).toHaveBeenCalledTimes(2);
  });

  it.skip('should resend confirmation code when user is unconfirmed', async () => {
    const mockedCognito = mockCognitoUsernameExistsException('UNCONFIRMED');

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(201);
    expect(mockedCognito).toHaveBeenCalledTimes(3);
  });

  it('should return 500 when Cognito throws an error', async () => {
    const mockedCognito = jest.fn().mockRejectedValueOnce(
      new InternalErrorException({
        message: 'Unknown error',
        $metadata: { httpStatusCode: 500 },
      }),
    );
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'InternalErrorException');
    expect(mockedCognito).toHaveBeenCalledTimes(1);
  });
});

describe.skip('POST /auth/confirm', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email or code is missing', async () => {
    let res = await request(app).post('/auth/confirm').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'code'");

    res = await request(app).post('/auth/confirm').send({ code: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
  });

  it('should call Cognito and return 200 on success', async () => {
    const result = {
      AccessToken: 'x',
      RefreshToken: 'y',
      IdToken: 'z',
      ExpiresIn: 3600,
    };
    const mockedCognito = jest.fn().mockResolvedValue({
      AuthenticationResult: result,
    });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    const res = await request(app)
      .post('/auth/confirm')
      .send({ email: 'test@example.com', code: '123456', onboardingUid: 'x' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken', result.AccessToken);
    expect(res.body).toHaveProperty('refreshToken', result.RefreshToken);
    expect(res.body).toHaveProperty('idToken', result.IdToken);
    expect(res.body).toHaveProperty('expiresIn', result.ExpiresIn);
    expect(mockedCognito).toHaveBeenCalledTimes(2);
  });

  it('should call Cognito and DynamoDB and return 200 on success (but without ExpiresIn)', async () => {
    const result = {
      AccessToken: 'x',
      RefreshToken: 'y',
      IdToken: 'z',
      ExpiresIn: 3600,
    };
    const mockedCognito = jest.fn().mockResolvedValue({
      AuthenticationResult: { ...result, ExpiresIn: undefined },
    });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    // Generate a valid encrypted password
    const encryptedPassword = encrypt('test-password-123');
    const mockedDynamoDb = jest
      .fn()
      .mockResolvedValueOnce({ Item: { temporaryPassword: encryptedPassword } }) // getTempPassword
      .mockResolvedValueOnce({}) // deleteTempPassword
      .mockResolvedValueOnce({}); // deleteTempPassword (fallback)
    DynamoDBDocumentClient.prototype.send = mockedDynamoDb;

    const res = await request(app)
      .post('/auth/confirm')
      .send({ email: 'test@example.com', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken', result.AccessToken);
    expect(res.body).toHaveProperty('refreshToken', result.RefreshToken);
    expect(res.body).toHaveProperty('idToken', result.IdToken);
    expect(res.body).toHaveProperty('expiresIn', result.ExpiresIn);
    expect(mockedCognito).toHaveBeenCalledTimes(2);
    expect(mockedDynamoDb).toHaveBeenCalledTimes(3);
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const mockedDynamoDb = jest.fn().mockResolvedValueOnce({}); // getTempPassword
    DynamoDBDocumentClient.prototype.send = mockedDynamoDb;

    const res = await request(app)
      .post('/auth/confirm')
      .send({ email: 'test@example.com', code: '123456' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'No pending signup for this email');
    expect(mockedDynamoDb).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when Cognito throws an error', async () => {
    const encryptedPassword = encrypt('test-password-123');
    const mockedDynamoDb = jest
      .fn()
      .mockResolvedValueOnce({ Item: { temporaryPassword: encryptedPassword } }); // getTempPassword
    DynamoDBDocumentClient.prototype.send = mockedDynamoDb;

    const mockedCognito = jest.fn().mockRejectedValueOnce(
      new InternalErrorException({
        message: 'Unknown error',
        $metadata: { httpStatusCode: 500 },
      }),
    );
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    const res = await request(app)
      .post('/auth/confirm')
      .send({ email: 'test@example.com', code: '123456' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'InternalErrorException');
    expect(mockedCognito).toHaveBeenCalledTimes(1);
    expect(mockedDynamoDb).toHaveBeenCalledTimes(1);
  });
});
