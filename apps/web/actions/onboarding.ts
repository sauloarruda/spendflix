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

async function getOnboardingAction(onboardingUid: string): Promise<Onboarding | null> {
  try {
    const onboarding = await onboardingService.find(onboardingUid);
    return onboarding;
  } catch (error) {
    logger.debug({ error }, 'Onboarding not found');
    return null;
  }
}

async function getOnboardingFromEmailAction(email: string): Promise<Onboarding | null> {
  return onboardingService.findByEmail(email);
}

async function startOnboardingAction(): Promise<Onboarding> {
  logger.debug('Creating onboarding...');
  return onboardingService.create();
}

export {
  startOnboardingAction,
  updateOnboardingAction,
  getOnboardingAction,
  getOnboardingFromEmailAction,
};
