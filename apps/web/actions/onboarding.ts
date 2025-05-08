'use server';
import { Onboarding } from 'generated/prisma';
import getLogger from '@/common/logger';
import { onboardingService, OnboardingData } from '@/modules/users';
const logger = getLogger().child({ module: 'onboarding' });

async function updateOnboardingAction(onboardingUid: string, data: Partial<OnboardingData>) {
  await onboardingService.update(onboardingUid, data);
}

async function getOnboardingAction(onboardingUid: string): Promise<OnboardingData> {
  return (await onboardingService.find(onboardingUid)).data as OnboardingData;
}

async function startOnboardingAction(): Promise<Onboarding> {
  return onboardingService.create();
}

export { startOnboardingAction, updateOnboardingAction, getOnboardingAction };
