import request from 'supertest';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import createApp from '../src/app';
import { encrypt } from '../lib/encryption';

describe('POST /auth/signup', () => {
  const app = createApp();
  let mockedDynamoDb: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
    process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
    process.env.ENCRYPTION_SECRET = 'test-secret-key-1234567890123456789012';

    mockedDynamoDb = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.prototype.send = mockedDynamoDb;
  });

  afterEach(() => {
    delete process.env.COGNITO_CLIENT_ID;
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.ENCRYPTION_SECRET;
  });

  it('should return 400 if name or email is missing', async () => {
    let res = await request(app).post('/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'name'");

    res = await request(app).post('/auth/signup').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
  });

  it('should call Cognito and DynamoDB and return 201 on success', async () => {
    const mockedCognito = jest.fn().mockResolvedValue({ User: { Username: 'mocked-user-id' } });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(201);

    expect(mockedCognito).toHaveBeenCalled();
    expect(mockedDynamoDb).toHaveBeenCalled();
  });
});

describe('POST /auth/confirm', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
    process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
    process.env.ENCRYPTION_SECRET = 'test-secret-key-1234567890123456789012';
  });

  afterEach(() => {
    delete process.env.COGNITO_CLIENT_ID;
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.ENCRYPTION_SECRET;
  });

  it('should return 400 if email or code is missing', async () => {
    let res = await request(app).post('/auth/confirm').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'code'");

    res = await request(app).post('/auth/confirm').send({ code: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
  });

  it('should call Cognito and DynamoDB and return 200 on success', async () => {
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
});
