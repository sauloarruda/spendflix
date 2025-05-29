import { OnboardingData } from '@/modules/users';
import { createContext, useContext } from 'react';

export interface OnboardingContextType {
  isLoadingOnboarding: boolean;
  userId: number | null;
  onboardingData: OnboardingData | null;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export default OnboardingContext;
