import { paths } from '../types/api';

const API_AUTH_URL = process.env.NEXT_PUBLIC_API_AUTH_URL;

export type OnboardingData =
  paths['/onboarding/{email}']['patch']['requestBody']['content']['application/json'];

export async function updateOnboardingStep(email: string, data: Partial<OnboardingData>) {
  try {
    const existingOnboarding = await getOnboardingData(email);

    if (existingOnboarding) {
      const updatedData = {
        ...(existingOnboarding as unknown as OnboardingData),
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await fetch(`${API_AUTH_URL}/onboarding/${email}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: updatedData }),
      });
    } else {
      // Create new onboarding
      const newData: OnboardingData = {
        startedAt: new Date().toISOString(),
        step: 1,
        ...data,
      };

      await fetch(`${API_AUTH_URL}/onboarding/${email}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: newData }),
      });
    }
  } catch (error) {
    console.error('Error updating onboarding:', error);
    throw error;
  }
}

export async function getOnboardingData(email: string) {
  try {
    const onboarding = await fetch(`${API_AUTH_URL}/onboarding/${email}`);

    return onboarding.body as OnboardingData | null;
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    throw error;
  }
}
