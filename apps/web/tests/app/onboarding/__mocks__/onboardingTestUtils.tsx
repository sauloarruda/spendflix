// Shared mocks and utilities for onboarding tests
import React from 'react';

// Router mocks
export const mockPush = jest.fn();
export const mockUseRouter = () => ({ push: mockPush });
export const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

// Cookie mock
export const mockHasSessionCookie = jest.fn().mockReturnValue(true);
jest.mock('@/utils/cookie', () => ({
  hasSessionCookie: mockHasSessionCookie,
  getSessionCookie: jest.fn().mockReturnValue('test-session-cookie'),
}));

// Onboarding service mock
export const onboardingServiceMock = {
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
};
jest.mock('@/modules/users/onboarding.service', () => onboardingServiceMock);

// Onboarding actions mock
export const startOnboardingAction = jest.fn().mockResolvedValue({ id: 'test-onboarding-id' });
export const getOnboardingAction = jest.fn().mockResolvedValue(null);
export const updateOnboardingAction = jest.fn().mockResolvedValue({});
jest.mock('@/actions/onboarding', () => ({
  startOnboardingAction,
  getOnboardingAction,
  updateOnboardingAction,
}));

// Accounts actions mock
export const createAccountAction = jest.fn();
jest.mock('@/actions/accounts', () => ({
  createAccountAction,
}));

// Server actions mock
export const autorizeAction = jest.fn((cookie, action) => action());
jest.mock('@/actions/serverActions', () => ({
  autorizeAction,
}));

// OnboardingContext mock
export const onboardingContextMock = {
  isLoadingOnboarding: false,
  userId: 123,
  onboardingData: {},
  updateOnboarding: jest.fn().mockResolvedValue(undefined),
  finishOnboarding: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => onboardingContextMock,
}));

// Component mocks
export const TEST_NAME = 'Test User';
export const TEST_EMAIL = 'test@example.com';

const SignupMock = ({
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
);
jest.mock('@/components/onboarding/Signup', () => ({
  __esModule: true,
  default: SignupMock,
}));

const ConfirmMock = ({ onSuccess }: { onSuccess: () => void }) => (
  <div data-testid="confirm-component">
    <button onClick={onSuccess}>Confirm Success</button>
  </div>
);
jest.mock('@/components/onboarding/Confirm', () => ({
  __esModule: true,
  default: ConfirmMock,
}));

const LoginMock = ({ onSuccess }: { onSuccess: () => void }) => (
  <div data-testid="login-component">
    <button onClick={onSuccess}>Login Success</button>
  </div>
);
jest.mock('@/components/auth/Login', () => ({
  __esModule: true,
  default: LoginMock,
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

// Utility for setting up localStorage/session
type StorageSetupOptions = {
  onboardingUid?: string;
  name?: string;
  email?: string;
  sessionCookie?: string;
};
export function setupLocalStorageAndSession({
  onboardingUid,
  name,
  email,
  sessionCookie,
}: StorageSetupOptions = {}) {
  localStorage.clear();
  if (onboardingUid) localStorage.setItem('onboardingUid', onboardingUid);
  if (name) localStorage.setItem('name', name);
  if (email) localStorage.setItem('email', email);
  if (sessionCookie) document.cookie = `session=${sessionCookie}`;
}
