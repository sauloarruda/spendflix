// Shared test utilities for app-level tests

// Router mocks
export const mockRouterPush = jest.fn();
export const mockUseRouter = () => ({ push: mockRouterPush });

// Common test data
export const TEST_NAME = 'Test User';
export const TEST_EMAIL = 'test@example.com';

// Utility for setting up localStorage/session
export function setupLocalStorageAndSession({
  onboardingUid,
  name,
  email,
  sessionCookie,
}: {
  onboardingUid?: string;
  name?: string;
  email?: string;
  sessionCookie?: string;
} = {}) {
  localStorage.clear();
  if (onboardingUid) localStorage.setItem('onboardingUid', onboardingUid);
  if (name) localStorage.setItem('name', name);
  if (email) localStorage.setItem('email', email);
  if (sessionCookie) document.cookie = `session=${sessionCookie}`;
}
