import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import onboardingActions from '@/actions/onboarding';

import Page from '@/app/onboarding/step1/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/modules/users/onboarding.repository', () => ({
  find: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    step: 1,
    userId: 'test-user-id',
  }),
  create: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    step: 1,
    userId: 'test-user-id',
  }),
  update: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    step: 1,
    userId: 'test-user-id',
  }),
}));

jest.mock('@/actions/onboarding', () => {
  const TEST_ONBOARDING_ID = 'test-onboarding-id';
  return {
    startOnboarding: jest.fn().mockResolvedValue({ id: TEST_ONBOARDING_ID }),
  };
});

jest.mock('@/components/Signup', () => {
  const TEST_NAME = 'Test User';
  const TEST_EMAIL = 'test@example.com';
  return {
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
  };
});

jest.mock('@/components/Confirm', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="confirm-component">
      <button onClick={onSuccess}>Confirm Success</button>
    </div>
  ),
}));

jest.mock('@/components/Login', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-component">
      <button onClick={onSuccess}>Login Success</button>
    </div>
  ),
}));

jest.mock('@/components/LoadingForm', () => ({
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

jest.mock('@/components/ApiError', () => ({
  __esModule: true,
  default: function MockApiError({ error }: { error?: string }) {
    return error ? <div data-testid="api-error">{error}</div> : null;
  },
}));

describe('Onboarding Step 1 Page', () => {
  const TEST_ONBOARDING_ID = 'test-onboarding-id';
  const EXISTING_ONBOARDING_ID = 'existing-onboarding-id';
  const TEST_NAME = 'Test User';
  const TEST_EMAIL = 'test@example.com';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('should initialize onboarding when no onboardingUid exists', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe(TEST_ONBOARDING_ID);
    });

    expect(onboardingActions.startOnboarding).toHaveBeenCalledTimes(1);
  });

  it('should not initialize onboarding when onboardingUid already exists', async () => {
    localStorage.setItem('onboardingUid', EXISTING_ONBOARDING_ID);

    render(<Page />);

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe(EXISTING_ONBOARDING_ID);
    });

    expect(onboardingActions.startOnboarding).not.toHaveBeenCalled();
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
    (onboardingActions.startOnboarding as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<Page />);

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

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/step2');
    });
  });
});
