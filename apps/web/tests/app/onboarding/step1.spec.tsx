import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { getOnboardingAction, startOnboardingAction } from '@/actions/onboarding';
import Page from '@/app/onboarding/step1/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/utils/auth', () => ({
  hasSessionCookie: jest.fn().mockReturnValue(true),
}));

jest.mock('@/modules/users/onboarding.repository', () => ({
  find: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    data: { step: 0 },
    userId: 'test-user-id',
  }),
  create: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    data: { step: 0 },
    userId: 'test-user-id',
  }),
  update: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    data: { step: 0 },
    userId: 'test-user-id',
  }),
}));

jest.mock('@/actions/onboarding', () => ({
  startOnboardingAction: jest.fn().mockResolvedValue({ id: 'test-onboarding-id' }),
  getOnboardingAction: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/components/onboarding/Signup', () => {
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
      expect(startOnboardingAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(localStorage.getItem('onboardingUid')).toBe(TEST_ONBOARDING_ID);
    });
  });

  it('should not initialize onboarding when onboardingUid already exists', async () => {
    localStorage.setItem('onboardingUid', EXISTING_ONBOARDING_ID);
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce({
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
    (startOnboardingAction as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce(null);

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

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/step2');
    });
  });
});
