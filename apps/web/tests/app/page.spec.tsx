import { OnboardingData } from '@/modules/users';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

import HomePage from '@/app/page'; // Assuming Home is the default export from page.tsx

const mockRouterPush = jest.fn();
let mockResumeOnboardingOnResume: (onboarding: OnboardingData) => void;
let mockResumeOnboardingOnError: () => void;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/components/onboarding/ResumeOnboarding', () => ({
  __esModule: true,
  default: ({
    children,
    onResume,
    onError,
    message,
  }: {
    children: React.ReactNode;
    onResume: (onboarding: OnboardingData) => void;
    onError: () => void;
    message: string;
  }) => {
    // Capture the callbacks to trigger them in tests
    mockResumeOnboardingOnResume = onResume;
    mockResumeOnboardingOnError = onError;
    return (
      <div data-testid="resume-onboarding-mock">
        <div data-testid="message-prop">{message}</div>
        {children}
      </div>
    );
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset captured callbacks if they were module-scoped and modified by tests
    // For this structure, they are reassigned each render of the mock, but good practice:
    mockResumeOnboardingOnResume = () => {};
    mockResumeOnboardingOnError = () => {};
  });

  it('renders ResumeOnboarding and its children content', () => {
    render(<HomePage />);
    expect(screen.getByTestId('resume-onboarding-mock')).toBeInTheDocument();
    expect(screen.getByTestId('message-prop')).toHaveTextContent('Preparando pra começar...');
    expect(screen.getByText('Redirecionando...')).toBeInTheDocument();
    // Check for spinner presence by class or a more specific test id if available
    const spinner = screen.getByText('Redirecionando...').nextElementSibling;
    expect(spinner).toHaveClass(
      'w-6',
      'h-6',
      'border-4',
      'border-blue-500',
      'border-t-transparent',
      'rounded-full',
      'animate-spin',
    );
  });

  it('calls router.push with correct path when ResumeOnboarding.onResume is triggered (no specific step)', () => {
    render(<HomePage />);
    const mockOnboardingData: OnboardingData = { step: null }; // Or 0, or undefined

    // act is needed because calling onResume will trigger router.push via handleFetchOnboarding,
    // which is a state-effective operation (navigation)
    act(() => {
      mockResumeOnboardingOnResume(mockOnboardingData);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step2');
  });

  it('calls router.push with correct path when ResumeOnboarding.onResume is triggered (with a specific step)', () => {
    render(<HomePage />);
    const mockOnboardingData: OnboardingData = { step: 3 };

    act(() => {
      mockResumeOnboardingOnResume(mockOnboardingData);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step3');
  });

  it('calls router.push with /onboarding/step2 if step is 0 when ResumeOnboarding.onResume is triggered', () => {
    render(<HomePage />);
    const mockOnboardingData: OnboardingData = { step: 0 };

    act(() => {
      mockResumeOnboardingOnResume(mockOnboardingData);
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step2');
  });

  it('calls router.push with /onboarding/step1 when ResumeOnboarding.onError is triggered', () => {
    render(<HomePage />);

    act(() => {
      mockResumeOnboardingOnError();
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step1');
  });
});
