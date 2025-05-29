import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import Page from '@/app/onboarding/step2/page';

import {
  mockRouterPush,
  mockUseRouter,
  TEST_NAME,
  setupLocalStorageAndSession,
} from '../testUtils';

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => '/onboarding/step2',
}));

jest.mock('@/contexts/OnboardingContext', () => {
  const mocks = require('./__mocks__/onboardingTestUtils');
  return {
    useOnboarding: () => ({
      isLoadingOnboarding: false,
      userId: 123,
      onboardingData: {
        name: TEST_NAME,
        goal: 'dream',
        goalDescription: 'Test Goal',
        goalValue: 5000,
        step: 2,
      },
      updateOnboarding: mocks.updateOnboardingAction,
      finishOnboarding: jest.fn(),
    }),
  };
});

describe('Onboarding Step 2 Page', () => {
  const TEST_ONBOARDING_ID = 'test-onboarding-id';

  beforeEach(() => {
    setupLocalStorageAndSession({
      onboardingUid: TEST_ONBOARDING_ID,
      name: TEST_NAME,
      sessionCookie: 'test-session-token',
    });
    jest.clearAllMocks();
    mockRouterPush.mockClear();
  });

  it('should load user data and onboarding information on mount', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Olá.*muito prazer!/i })).toBeInTheDocument();
    });
  });

  it('should show goal selection options', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Quero realizar um sonho/i)).toBeInTheDocument();
      expect(screen.getByText(/Quero sair das dívidas/i)).toBeInTheDocument();
    });
  });

  it('should change form fields when selecting a different goal', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Quero sair das dívidas/i)).toBeInTheDocument();
    });

    const debtOption = screen.getByText(/Quero sair das dívidas/i);
    const dreamOption = screen.getByText(/Quero realizar um sonho/i);

    fireEvent.click(debtOption);
    await waitFor(() => {
      const debtInput = screen.getByLabelText((label) => label.toLowerCase().includes('dívida'));
      expect(debtInput).toBeInTheDocument();
    });

    fireEvent.click(dreamOption);
    await waitFor(() => {
      const dreamInput = screen.getByLabelText((label) => label.toLowerCase().includes('sonho'));
      expect(dreamInput).toBeInTheDocument();
    });
  });
});
