import { Onboarding, Prisma } from '../../generated/prisma';
import { components } from '../types/api';
import getPrisma from './prisma';

type OnboardingData = components['schemas']['OnboardingData'];

async function find(id: string): Promise<Onboarding> {
  return getPrisma().onboarding.findFirstOrThrow({
    where: { id },
  });
}

async function create(userId: number, data: OnboardingData): Promise<Onboarding> {
  return getPrisma().onboarding.create({
    data: { data, userId },
  });
}

async function update(id: string, data: Partial<OnboardingData>) {
  const existingOnboarding = await find(id);

  const updatedData = {
    ...(existingOnboarding.data as Prisma.JsonObject),
    ...data,
  };

  await getPrisma().onboarding.update({
    where: { id },
    data: { data: updatedData },
  });
}

const onboardingRepository = { find, create, update };

export default onboardingRepository;
