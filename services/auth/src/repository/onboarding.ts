import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

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
  const temporaryPassword = generateCognitoPassword(32);
  const onboarding = { name, email, temporaryPassword };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: onboarding }));
  return onboarding;
}

async function getTempPassword(email: string): Promise<string | undefined> {
  const res = await docClient.send(new GetCommand({ TableName: TABLE, Key: { email } }));
  return res.Item?.temporaryPassword;
}

async function deleteTempPassword(email: string) {
  await docClient.send(
    new PutCommand({ TableName: TABLE, Item: { email, temporaryPassword: undefined } }),
  );
}

const onboardingRepository = { saveStep1, getTempPassword, deleteTempPassword };

export default onboardingRepository;
