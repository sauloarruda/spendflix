import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import ForgotPasswordPage from '@/app/forgot-password/page';

const mockRouterPush = jest.fn();
const TEST_EMAIL = 'test@example.com';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock child components
jest.mock('@/components/auth/ForgotPassword', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (email: string) => void }) => (
    <div data-testid="forgot-password-component">
      <button onClick={() => onSuccess(TEST_EMAIL)}>Submit Forgot Password</button>
    </div>
  ),
}));

jest.mock('@/components/auth/ResetPassword', () => ({
  __esModule: true,
  default: ({ email, onSuccess }: { email: string; onSuccess: () => void }) => (
    <div data-testid="reset-password-component">
      <p>Email: {email}</p>
      <button onClick={onSuccess}>Submit Reset Password</button>
    </div>
  ),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    // Clear any potential state from previous tests if localStorage or similar were used
    // by actual components
  });

  it('should render the ForgotPassword component initially', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId('forgot-password-component')).toBeInTheDocument();
    expect(screen.queryByTestId('reset-password-component')).not.toBeInTheDocument();
  });

  it('should switch to ResetPassword component with the correct email on ForgotPassword success', async () => {
    render(<ForgotPasswordPage />);

    // Ensure ForgotPassword component is rendered
    expect(screen.getByTestId('forgot-password-component')).toBeInTheDocument();

    // Simulate onSuccess callback from ForgotPassword component
    fireEvent.click(screen.getByText('Submit Forgot Password'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-component')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('forgot-password-component')).not.toBeInTheDocument();
    expect(screen.getByText(`Email: ${TEST_EMAIL}`)).toBeInTheDocument();
  });

  it('should navigate to /login on ResetPassword success', async () => {
    render(<ForgotPasswordPage />);

    // First, transition to ResetPassword component
    fireEvent.click(screen.getByText('Submit Forgot Password'));
    await waitFor(() => {
      expect(screen.getByTestId('reset-password-component')).toBeInTheDocument();
    });

    // Simulate onSuccess callback from ResetPassword component
    fireEvent.click(screen.getByText('Submit Reset Password'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });
});
