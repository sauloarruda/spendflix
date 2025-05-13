'use server';

import getLogger from '@/common/logger';
import { onboardingService, OnboardingData } from '@/modules/users';

import { Onboarding } from '@/prisma';

const logger = getLogger().child({ module: 'onboardingActions' });

async function updateOnboardingAction(onboardingUid: string, data: Partial<OnboardingData>) {
  await onboardingService.update(onboardingUid, data);
}

async function getOnboardingAction(onboardingUid: string): Promise<OnboardingData> {
  return (await onboardingService.find(onboardingUid)).data as OnboardingData;
}

async function startOnboardingAction(): Promise<Onboarding> {
  logger.debug('Creating onboarding...');
  return onboardingService.create();
}

export { startOnboardingAction, updateOnboardingAction, getOnboardingAction };
