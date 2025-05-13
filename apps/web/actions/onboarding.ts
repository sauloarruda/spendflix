'use server';

import getLogger from '@/common/logger';
import { onboardingService, OnboardingData } from '@/modules/users';

import { Onboarding } from '@/prisma';

const logger = getLogger().child({ module: 'onboardingActions' });

async function updateOnboarding(onboardingUid: string, data: Partial<OnboardingData>) {
  await onboardingService.update(onboardingUid, data);
}

async function getOnboarding(onboardingUid: string): Promise<OnboardingData> {
  return (await onboardingService.find(onboardingUid)).data as OnboardingData;
}

async function startOnboarding(): Promise<Onboarding> {
  logger.debug('Creating onboarding...');
  return onboardingService.create();
}

const onboardingActions = {
  startOnboarding,
  updateOnboarding,
  getOnboarding,
};
export default onboardingActions;
