// signup.spec.ts
// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import createApp from '../src/app';

describe('POST /auth/signup', () => {
  const app = createApp();
  let mockedDynamoDb: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedDynamoDb = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.prototype.send = mockedDynamoDb;
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

  it('should return 500 if Cognito returns UsernameExistsException', async () => {
    // Mock Cognito to throw UsernameExistsException
    const mockedCognito = jest.fn().mockRejectedValue({ name: 'UsernameExistsException' });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    // Mock DynamoDBDocumentClient to record calls
    const mockedDoc = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.prototype.send = mockedDoc;

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Failed to create user');

    expect(mockedCognito).toHaveBeenCalled();
    // Ensure we attempted to delete temp password
    expect(mockedDoc).toHaveBeenCalled();
  });
});
