import { OnboardingData } from '@/modules/users';
import { createContext, useContext, useEffect, useState } from 'react';

import { getOnboardingAction, updateOnboardingAction } from '@/actions/onboarding';

export interface OnboardingContextType {
  isLoadingOnboarding: boolean;
  userId: number | null;
  onboardingData: OnboardingData | null;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    async function loadOnboarding() {
      const onboardingUid = localStorage.getItem('onboardingUid');
      if (!onboardingUid) {
        setIsLoadingOnboarding(false);
        return;
      }

      try {
        const onboarding = await getOnboardingAction(onboardingUid);
        if (onboarding) {
          setUserId(onboarding.userId);
          setOnboardingData(onboarding.data as OnboardingData);
        }
      } finally {
        setIsLoadingOnboarding(false);
      }
    }

    loadOnboarding();
  }, []);

  const updateOnboarding = async (data: Partial<OnboardingData>) => {
    const onboardingUid = localStorage.getItem('onboardingUid');
    if (!onboardingUid) return;

    try {
      await updateOnboardingAction(onboardingUid, data, undefined);
      setOnboardingData((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error('Failed to update onboarding:', error);
      throw error;
    }
  };

  const finishOnboarding = async () => {
    const onboardingUid = localStorage.getItem('onboardingUid');
    if (!onboardingUid) return;

    try {
      await updateOnboardingAction(
        onboardingUid,
        { finishedAt: new Date().toISOString() },
        undefined,
      );
      // eslint-disable-next-line no-confusing-arrow
      setOnboardingData((prev) =>
        prev ? { ...prev, finishedAt: new Date().toISOString() } : null,
      );
    } catch (error) {
      console.error('Failed to finish onboarding:', error);
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isLoadingOnboarding,
        userId,
        onboardingData,
        updateOnboarding,
        finishOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
