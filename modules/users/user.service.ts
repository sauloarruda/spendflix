import { User } from '@/prisma';

import { encrypt, decrypt } from '@/common/encryption';

import getPrisma from '../common/prisma';

const DEFAULT_PASSWORD_LENGTH = 32;
const DEFAULT_RAND_FACTOR = 0.5;
const generateTemporaryPassword = (length = DEFAULT_PASSWORD_LENGTH): string => {
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

  return pwdChars.sort(() => DEFAULT_RAND_FACTOR - Math.random()).join('');
};

async function findByEmail(email: string): Promise<User | undefined> {
  const res = await getPrisma().user.findMany({ where: { email } });
  if (!res.length) return undefined;
  return res[0];
}

async function startOnboarding(name: string, email: string): Promise<User> {
  let user = await findByEmail(email);
  if (!user || !user.temporaryPassword) {
    const temporaryPassword = generateTemporaryPassword();
    const encryptedPassword = encrypt(temporaryPassword);
    const data = {
      name,
      email,
      temporaryPassword: encryptedPassword,
    };
    user = await (user
      ? getPrisma().user.update({ where: { id: user.id }, data })
      : getPrisma().user.create({ data }));
  }
  return user;
}

async function getTempPassword(email: string): Promise<string | undefined> {
  const user = await findByEmail(email);
  if (!user || !user.temporaryPassword) {
    return undefined;
  }
  const decrypted = decrypt(user.temporaryPassword);
  return decrypted;
}

async function deleteTempPassword(email: string) {
  const user = await findByEmail(email);
  if (!user) return;
  await getPrisma().user.delete({ where: { id: user.id } });
}

async function upsertUser(userData: Partial<User>): Promise<User> {
  if (!userData.id) return getPrisma().user.create({ data: userData as User });
  return getPrisma().user.update({ where: { id: userData.id }, data: userData });
}

async function find(id: number): Promise<User> {
  return getPrisma().user.findFirstOrThrow({ where: { id } });
}

const userService = {
  startOnboarding,
  getTempPassword,
  deleteTempPassword,
  findByEmail,
  upsertUser,
  find,
};

export default userService;
