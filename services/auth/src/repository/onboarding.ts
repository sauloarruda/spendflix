import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { encrypt, decrypt } from '../../lib/encryption';
import { logger } from '../../lib/logger';

const authLogger = logger.child({ module: 'onboarding' });

const endpoint = process.env.IS_OFFLINE ? 'http://localhost:8000' : undefined;

const rawClient = new DynamoDBClient(
  endpoint
    ? { endpoint } // local
    : {}, // prod
);

export type Onboarding = {
  name: string;
  email: string;
  temporaryPassword: string;
};

const docClient = DynamoDBDocumentClient.from(rawClient);
const TABLE = 'onboarding';

const generateCognitoPassword = (length = 12): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_+=<>?';

  const pwdChars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  const all = upper + lower + digits + special;
  for (let i = pwdChars.length; i < length; i += 1) {
    pwdChars.push(all[Math.floor(Math.random() * all.length)]);
  }

  return pwdChars.sort(() => 0.5 - Math.random()).join('');
};

async function saveStep1(name: string, email: string): Promise<Onboarding> {
  authLogger.debug('Saving onboarding step 1');
  const temporaryPassword = generateCognitoPassword(32);
  const encryptedPassword = encrypt(temporaryPassword);
  const onboarding = { name, email, temporaryPassword: encryptedPassword };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: onboarding }));
  authLogger.debug('Onboarding step 1 saved successfully');
  return { ...onboarding, temporaryPassword }; // Return unencrypted password for immediate use
}

async function getTempPassword(email: string): Promise<string | undefined> {
  authLogger.info({ email }, 'Retrieving temporary password');
  const res = await docClient.send(new GetCommand({ TableName: TABLE, Key: { email } }));

  if (!res.Item?.temporaryPassword) {
    authLogger.warn({ email }, 'No temporary password found');
    return undefined;
  }
  const decrypted = decrypt(res.Item.temporaryPassword);
  authLogger.info({ email }, 'Temporary password decrypted successfully');
  return decrypted;
}

async function deleteTempPassword(email: string) {
  await docClient.send(
    new PutCommand({ TableName: TABLE, Item: { email, temporaryPassword: undefined } }),
  );
}

const onboardingRepository = { saveStep1, getTempPassword, deleteTempPassword };

export default onboardingRepository;
