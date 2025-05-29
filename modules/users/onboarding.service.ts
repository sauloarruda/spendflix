import { Onboarding, Prisma } from '@/prisma';

import getPrisma from '../common/prisma';

export type OnboardingData = {
  step?: number;
  name?: string;
  goal?: 'dream' | 'debt';
  goalDescription?: string;
  goalValue?: number;
  banks?: string[];
  waitlist?: boolean;
  finishedAt?: string;
};

async function find(id: string): Promise<Onboarding> {
  return getPrisma().onboarding.findFirstOrThrow({
    where: { id },
  });
}

async function findByEmail(email: string): Promise<Onboarding | null> {
  return getPrisma().onboarding.findFirst({
    include: { user: true },
    where: { user: { email } },
  });
}

async function create(): Promise<Onboarding> {
  return getPrisma().onboarding.create({
    data: { data: { step: 0 } as OnboardingData },
  });
}

async function update(id: string, data: Partial<OnboardingData>, userId: number | undefined) {
  const existingOnboarding = await find(id);

  const updatedData = {
    ...(existingOnboarding.data as Prisma.JsonObject),
    ...data,
  };

  const userData = userId ? { data: updatedData, userId } : { data: updatedData };

  await getPrisma().onboarding.update({
    where: { id },
    data: userData,
  });
}

const onboardingService = {
  find,
  create,
  update,
  findByEmail,
};

export default onboardingService;
