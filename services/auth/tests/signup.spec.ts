import request from 'supertest';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import createApp from '../src/app';

describe('POST /auth/signup', () => {
  const app = createApp();

  it('should return 400 if name or email is missing', async () => {
    let res = await request(app).post('/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'name'");

    res = await request(app).post('/auth/signup').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
  });

  it('should call Cognito API and return 201 on success', async () => {
    const mockedSend = jest.fn().mockResolvedValue({
      User: { Username: 'mocked-user-id' },
    });
    CognitoIdentityProviderClient.prototype.send = mockedSend;

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created');
    expect(res.body).toHaveProperty('userId', 'mocked-user-id');
  });

  it('should return 500 if Cognito returns userAlreadyExists error', async () => {
    const mockedSend = jest.fn().mockRejectedValue({
      name: 'UsernameExistsException',
      message: 'User already exists',
    });

    const mockedClient = new CognitoIdentityProviderClient({});
    mockedClient.send = mockedSend;
    CognitoIdentityProviderClient.prototype.send = mockedSend;

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Failed to create user');
  });
});
