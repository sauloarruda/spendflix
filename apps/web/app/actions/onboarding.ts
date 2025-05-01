'use server';

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export type OnboardingData = {
  startedAt: Date;
  step: number;
  name?: string;
  goal?: 'dream' | 'debt';
  goalDescription?: string;
  goalValue?: number;
  banks?: string[];
  finishedAt?: Date;
};

export async function updateOnboardingStep(email: string, data: Partial<OnboardingData>) {
  try {
    const existingOnboarding = await prisma.onboarding.findUnique({
      where: { email },
    });

    if (existingOnboarding) {
      // Update existing onboarding
      const updatedData = {
        ...(existingOnboarding.data as unknown as OnboardingData),
        ...data,
        updatedAt: new Date(),
      };

      await prisma.onboarding.update({
        where: { email },
        data: { data: updatedData },
      });
    } else {
      // Create new onboarding
      const newData: OnboardingData = {
        startedAt: new Date(),
        step: 1,
        ...data,
      };

      await prisma.onboarding.create({
        data: {
          email,
          data: newData,
        },
      });
    }
  } catch (error) {
    console.error('Error updating onboarding:', error);
    throw error;
  }
}

export async function getOnboardingData(email: string) {
  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { email },
    });

    return onboarding?.data as unknown as OnboardingData | null;
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    throw error;
  }
}
