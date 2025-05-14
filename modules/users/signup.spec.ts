import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { faker } from '@faker-js/faker';

import signupService from './signup.service';

describe('Signup', () => {
  it('should call Cognito and create user', async () => {
    const mockedCognito = jest.fn().mockResolvedValue({ User: { Username: 'mocked-user-id' } });
    CognitoIdentityProviderClient.prototype.send = mockedCognito;

    const res = await signupService.signup(faker.person.firstName(), faker.internet.email());

    expect(res.id).not.toBeNull();
    expect(mockedCognito).toHaveBeenCalledTimes(1);
  });
});
