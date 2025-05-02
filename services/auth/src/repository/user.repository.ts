import { User } from '../../generated/prisma';
import { encrypt, decrypt } from '../../lib/encryption';
import { logger } from '../../lib/logger';
import onboardingRepository from './onboarding.repository';
import getPrisma from './prisma';

const authLogger = logger.child({ module: 'onboarding' });

export type SignupUser = {
  name: string;
  email: string;
  temporaryPassword: string;
  onboardingUid: string;
};

const generateTemporaryPassword = (length = 12): string => {
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

async function findByEmail(email: string): Promise<User | undefined> {
  const res = await getPrisma().user.findMany({ where: { email } });
  if (!res.length) return undefined;
  return res[0];
}

async function startOnboarding(name: string, email: string): Promise<SignupUser> {
  const onboarding = { name, startedAt: new Date().toISOString(), step: 1 };
  let user = await findByEmail(email);
  if (!user || !user.temporaryPassword) {
    authLogger.debug('Saving temporary password');
    const temporaryPassword = generateTemporaryPassword(32);
    const encryptedPassword = encrypt(temporaryPassword);
    const data = {
      name,
      email,
      temporaryPassword: encryptedPassword,
    };
    user = await (user
      ? getPrisma().user.update({ where: { id: user.id }, data })
      : getPrisma().user.create({ data }));
    authLogger.debug('Temporary password saved successfully');
  }
  authLogger.debug({ user }, 'SignupUser created');

  const lastOnboarding = await onboardingRepository.create(user?.id, onboarding);

  return {
    name: user.name,
    email: user.email,
    temporaryPassword: user.temporaryPassword!,
    onboardingUid: lastOnboarding.id,
  };
}

async function getTempPassword(email: string): Promise<string | undefined> {
  authLogger.info({ email }, 'Retrieving temporary password');

  const user = await findByEmail(email);
  if (!user || !user.temporaryPassword) {
    authLogger.warn({ email }, 'No temporary password found');
    return undefined;
  }
  const decrypted = decrypt(user.temporaryPassword);
  authLogger.info({ email }, 'Temporary password decrypted successfully');
  console.log(decrypted);
  return decrypted;
}

async function deleteTempPassword(email: string) {
  const user = await findByEmail(email);
  if (!user) return;
  getPrisma().user.delete({ where: { id: user.id } });
}

const userRepository = {
  startOnboarding,
  getTempPassword,
  deleteTempPassword,
};

export default userRepository;
