import { render, waitFor } from '@testing-library/react';
import React from 'react';

import onboardingActions from '@/actions/onboarding';

import Page from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/actions/onboarding', () => ({
  startOnboarding: jest.fn().mockResolvedValue({ id: 'test-onboarding-id' }),
}));

describe('Onboarding Step 1 Page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize onboarding when no onboardingUid exists', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe('test-onboarding-id');
    });

    expect(onboardingActions.startOnboarding).toHaveBeenCalledTimes(1);
  });
});
