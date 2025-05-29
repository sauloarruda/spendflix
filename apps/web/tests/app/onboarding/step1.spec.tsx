import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import Page from '@/app/onboarding/step1/page';

import {
  mockUseRouter,
  mockUsePathname,
  mockRouterPush,
  setupLocalStorageAndSession,
  TEST_NAME,
  TEST_EMAIL,
} from '../testUtils';

import {
  startOnboardingAction,
  getOnboardingAction,
  onboardingServiceMock,
} from './__mocks__/onboardingTestUtils';

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/modules/users/onboarding.service', () => onboardingServiceMock);

jest.mock('@/actions/onboarding', () => {
  const mocks = require('./__mocks__/onboardingTestUtils');
  return {
    startOnboardingAction: mocks.startOnboardingAction,
    getOnboardingAction: mocks.getOnboardingAction,
    updateOnboardingAction: mocks.updateOnboardingAction,
  };
});

jest.mock('@/components/onboarding/Signup', () => ({
  __esModule: true,
  default: ({
    onSuccess,
    onLoginRedirect,
  }: {
    onSuccess: (name: string, email: string) => void;
    onLoginRedirect: (email: string) => void;
  }) => (
    <div data-testid="signup-component">
      <button onClick={() => onSuccess(TEST_NAME, TEST_EMAIL)}>Signup Success</button>
      <button onClick={() => onLoginRedirect(TEST_EMAIL)}>Login Redirect</button>
    </div>
  ),
}));

jest.mock('@/components/onboarding/Confirm', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="confirm-component">
      <button onClick={onSuccess}>Confirm Success</button>
    </div>
  ),
}));

jest.mock('@/components/auth/Login', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-component">
      <button onClick={onSuccess}>Login Success</button>
    </div>
  ),
}));

jest.mock('@/components/utils/LoadingForm', () => ({
  __esModule: true,
  default: function MockLoadingForm({
    children,
    onLoad,
  }: {
    children: React.ReactNode;
    onLoad: () => void;
  }) {
    React.useEffect(() => {
      onLoad();
    }, [onLoad]);
    return <div data-testid="loading-form">{children}</div>;
  },
}));

jest.mock('@/components/utils/ApiError', () => ({
  __esModule: true,
  default: function MockApiError({ error }: { error?: string }) {
    return error ? <div data-testid="api-error">{error}</div> : null;
  },
}));

describe('Onboarding Step 1 Page', () => {
  const TEST_ONBOARDING_ID = 'test-onboarding-id';
  const EXISTING_ONBOARDING_ID = 'existing-onboarding-id';

  beforeEach(() => {
    setupLocalStorageAndSession();
    jest.clearAllMocks();
    mockRouterPush.mockClear();
  });

  it('should initialize onboarding when no onboardingUid exists', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(startOnboardingAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe(TEST_ONBOARDING_ID);
    });
  });

  it('should not initialize onboarding when onboardingUid already exists', async () => {
    localStorage.setItem('onboardingUid', EXISTING_ONBOARDING_ID);
    getOnboardingAction.mockResolvedValueOnce({
      id: EXISTING_ONBOARDING_ID,
      data: { step: 0 },
      userId: 'test-user-id',
    });

    render(<Page />);

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe(EXISTING_ONBOARDING_ID);
    });

    expect(startOnboardingAction).not.toHaveBeenCalled();
  });

  it('should show signup component by default', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('signup-component')).toBeInTheDocument();
    });
  });

  it('should transition to confirm step after successful signup', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('signup-component')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Signup Success'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-component')).toBeInTheDocument();
      expect(localStorage.getItem('name')).toBe(TEST_NAME);
      expect(localStorage.getItem('email')).toBe(TEST_EMAIL);
    });
  });

  it('should transition to login step when login redirect is clicked', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('signup-component')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Login Redirect'));

    await waitFor(() => {
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
    });
  });

  it('should show api error when onboarding initialization fails', async () => {
    const errorMessage = 'Failed to start onboarding';
    startOnboardingAction.mockRejectedValueOnce(new Error(errorMessage));
    getOnboardingAction.mockResolvedValueOnce(null);

    render(<Page />);

    await waitFor(() => {
      expect(startOnboardingAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('api-error')).toHaveTextContent(errorMessage);
    });
  });

  it('should redirect to /onboarding/step2 after confirm success', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('signup-component')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Signup Success'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-component')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm Success'));
    console.log('Clicked Confirm Success');

    await waitFor(() => {
      console.log('mockRouterPush calls:', mockRouterPush.mock.calls);
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step2');
    });
  });
});
