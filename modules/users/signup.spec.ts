import { faker } from '@faker-js/faker';
// import {
//   CognitoIdentityProviderClient,
//   UsernameExistsException,
// } from '@aws-sdk/client-cognito-identity-provider';
// import getPrisma from '@/common/prisma';
// import { initialize, defineUserFactory, defineOnboardingFactory } from '@/fabbrica';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import signupService from './signup.service';

// const mockCognitoUsernameExistsException = (userStatus: string) => {
//   const mockedCognito = jest
//     .fn()
//     .mockRejectedValueOnce(
//       new UsernameExistsException({
//         message: 'User already exists',
//         $metadata: { httpStatusCode: 400 },
//       }),
//     )
//     .mockResolvedValueOnce({ UserStatus: userStatus });

//   if (userStatus === 'UNCONFIRMED') {
//     mockedCognito.mockResolvedValueOnce({});
//   }

//   CognitoIdentityProviderClient.prototype.send = mockedCognito;
//   return mockedCognito;
// };

// initialize({ prisma: getPrisma() });

describe('Signup', () => {
  it('should call Cognito and create user', async () => {
    const mockedCognito = jest.fn().mockResolvedValue({ User: { Username: 'mocked-user-id' } });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    const res = await signupService.signup(faker.person.firstName(), faker.internet.email());

    expect(res.onboardingUid).not.toBeNull();
    expect(mockedCognito).toHaveBeenCalledTimes(1);
  });

  // it('should return 400 when user is already confirmed', async () => {
  //   const mockedCognito = mockCognitoUsernameExistsException('CONFIRMED');

  //   const res = await request(app)
  //     .post('/auth/signup')
  //     .send({ name: faker.person.firstName(), email: faker.internet.email() });

  //   expect(res.status).toBe(400);
  //   expect(res.body).toHaveProperty('error', 'UsernameExistsException');
  //   expect(mockedCognito).toHaveBeenCalledTimes(2);
  // });

  // it('should resend confirmation code when user is unconfirmed', async () => {
  //   const mockedCognito = mockCognitoUsernameExistsException('UNCONFIRMED');

  //   const res = await request(app)
  //     .post('/auth/signup')
  //     .send({ name: faker.person.firstName(), email: faker.internet.email() });

  //   expect(res.status).toBe(201);
  //   expect(mockedCognito).toHaveBeenCalledTimes(3);
  // });

  // it('should return 500 when Cognito throws an error', async () => {
  //   const mockedCognito = jest.fn().mockRejectedValueOnce(
  //     new InternalErrorException({
  //       message: 'Unknown error',
  //       $metadata: { httpStatusCode: 500 },
  //     }),
  //   );
  //   CognitoIdentityProviderClient.prototype.send = mockedCognito;

  //   const res = await request(app)
  //     .post('/auth/signup')
  //     .send({ name: faker.person.firstName(), email: faker.internet.email() });

  //   expect(res.status).toBe(500);
  //   expect(res.body).toHaveProperty('error', 'InternalErrorException');
  //   expect(mockedCognito).toHaveBeenCalledTimes(1);
  // });
});

// describe('POST /auth/confirm', () => {
//   const app = createApp();
//   let user: User;
//   let onboarding: Onboarding;
//   let tokens: {
//     ExpiresIn: number | undefined;
//     AccessToken: string;
//     RefreshToken: string;
//     IdToken: string;
//   };

//   beforeEach(async () => {
//     jest.clearAllMocks();

//     user = await defineUserFactory().create({
//       name: faker.person.firstName(),
//       email: faker.internet.email(),
//       temporaryPassword: encrypt(faker.internet.password()),
//     });
//     onboarding = await defineOnboardingFactory({
//       defaultData: {
//         user: {
//           connect: { id: user.id },
//         },
//       },
//     }).create();
//     tokens = {
//       AccessToken: 'x',
//       RefreshToken: 'y',
//       IdToken: 'z',
//       ExpiresIn: 3600,
//     };
//   });

//   it('should return 400 if email or code is missing', async () => {
//     let res = await request(app).post('/auth/confirm').send({});
//     expect(res.status).toBe(400);
//     expect(res.body).toHaveProperty('message', "request/body must have required property 'code'");

//     res = await request(app).post('/auth/confirm').send({ code: 'A' });
//     expect(res.status).toBe(400);
//     expect(res.body).toHaveProperty('message', "request/body must have required property 'email'");
//   });

//   it('should call Cognito and return 200 on success', async () => {
//     const mockedCognito = jest.fn().mockResolvedValue({
//       AuthenticationResult: tokens,
//     });
//     CognitoIdentityProviderClient.prototype.send = mockedCognito;

//     const res = await request(app)
//       .post('/auth/confirm')
//       .send({ email: user.email, code: '123456', onboardingUid: onboarding.id });

//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty('accessToken', tokens.AccessToken);
//     expect(res.body).toHaveProperty('refreshToken', tokens.RefreshToken);
//     expect(res.body).toHaveProperty('idToken', tokens.IdToken);
//     expect(res.body).toHaveProperty('expiresIn', tokens.ExpiresIn);
//     expect(mockedCognito).toHaveBeenCalledTimes(2);
//   });

//   it('should call Cognito return 200 on success (but without ExpiresIn)', async () => {
//     const mockedCognito = jest.fn().mockResolvedValue({
//       AuthenticationResult: { ...tokens, ExpiresIn: undefined },
//     });
//     CognitoIdentityProviderClient.prototype.send = mockedCognito;

//     const res = await request(app)
//       .post('/auth/confirm')
//       .send({ email: user.email, code: '123456', onboardingUid: onboarding.id });

//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty('accessToken', tokens.AccessToken);
//     expect(res.body).toHaveProperty('refreshToken', tokens.RefreshToken);
//     expect(res.body).toHaveProperty('idToken', tokens.IdToken);
//     expect(res.body).toHaveProperty('expiresIn', tokens.ExpiresIn);
//     expect(mockedCognito).toHaveBeenCalledTimes(2);
//   });

//   it('should return 500 when Cognito throws an error', async () => {
//     const mockedCognito = jest.fn().mockRejectedValueOnce(
//       new InternalErrorException({
//         message: 'Unknown error',
//         $metadata: { httpStatusCode: 500 },
//       }),
//     );
//     CognitoIdentityProviderClient.prototype.send = mockedCognito;

//     const res = await request(app)
//       .post('/auth/confirm')
//       .send({ email: user.email, code: '123456', onboardingUid: onboarding.id });

//     expect(res.status).toBe(500);
//     expect(res.body).toHaveProperty('error', 'InternalErrorException');
//     expect(mockedCognito).toHaveBeenCalledTimes(1);
//   });
// });
