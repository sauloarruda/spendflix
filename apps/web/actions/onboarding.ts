'use server';

import getLogger from '@/common/logger';
import { onboardingService, OnboardingData } from '@/modules/users';

import { Onboarding } from '@/prisma';

const logger = getLogger().child({ module: 'onboardingActions' });

async function updateOnboardingAction(
  onboardingUid: string,
  data: Partial<OnboardingData>,
  userId: number | undefined = undefined,
) {
  await onboardingService.update(onboardingUid, data, userId);
}

async function getOnboardingAction(onboardingUid: string): Promise<Onboarding> {
  return onboardingService.find(onboardingUid);
}

async function startOnboardingAction(): Promise<Onboarding> {
  logger.debug('Creating onboarding...');
  return onboardingService.create();
}

export { startOnboardingAction, updateOnboardingAction, getOnboardingAction };
