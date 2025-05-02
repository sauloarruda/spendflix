import { components, paths } from '../types/api';

const API_AUTH_URL = [process.env.NEXT_PUBLIC_API_AUTH_URL, 'onboarding'].join('/');

export type OnboardingData = components['schemas']['OnboardingData'];

export async function updateOnboardingStep(onboardingUid: string, data: Partial<OnboardingData>) {
  try {
    await fetch([API_AUTH_URL, onboardingUid].join('/'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error updating onboarding:', error);
    throw error;
  }
}

export async function getOnboardingData(onboardingUid: string) {
  try {
    const onboarding = await fetch(`${API_AUTH_URL}/${onboardingUid}`);
    return (await onboarding.json()) as OnboardingData | null;
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    throw error;
  }
}
