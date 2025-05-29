import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import Page from '@/app/onboarding/step2/page';

const mockPush = jest.fn();
const updateOnboardingMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/onboarding/step2',
}));

jest.mock('@/components/onboarding/ResumeOnboarding', () => ({
  useOnboarding: () => ({
    isLoadingOnboarding: false,
    userId: 123,
    onboardingData: {
      name: 'Test User',
      goal: 'dream',
      goalDescription: 'Test Goal',
      goalValue: 5000,
      step: 2,
    },
    updateOnboarding: updateOnboardingMock,
    finishOnboarding: jest.fn(),
  }),
}));

describe('Onboarding Step 2 Page', () => {
  const TEST_ONBOARDING_ID = 'test-onboarding-id';
  const TEST_NAME = 'Test User';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockPush.mockClear();

    // Setup localStorage with required values
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_ID);
    localStorage.setItem('name', TEST_NAME);

    // Setup session cookie
    document.cookie = 'session=test-session-token';
  });

  it('should load user data and onboarding information on mount', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Olá Test User, muito prazer!/i)).toBeInTheDocument();
    });
  });

  it('should show goal selection options', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Quero realizar um sonho/i)).toBeInTheDocument();
      expect(screen.getByText(/Quero sair das dívidas/i)).toBeInTheDocument();
    });
  });

  it('should show form fields based on loaded goal data', async () => {
    render(<Page />);
    await waitFor(() => {
      const descriptionInput = screen.getByLabelText(/Qual é o seu sonho?/i);
      expect(descriptionInput).toBeInTheDocument();
      expect(descriptionInput).toHaveValue('Test Goal');

      const amountInput = screen.getByRole('spinbutton');
      expect(amountInput).toBeInTheDocument();
      expect(amountInput).toHaveAttribute('aria-valuenow', '5000');
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
      const debtInput = screen.getByLabelText(/Qual é a dívida?/i);
      expect(debtInput).toBeInTheDocument();
    });

    fireEvent.click(dreamOption);
    await waitFor(() => {
      const dreamInput = screen.getByLabelText(/Qual é o seu sonho?/i);
      expect(dreamInput).toBeInTheDocument();
    });
  });

  it('should redirect to step 3 when continue button is clicked', async () => {
    render(<Page />);
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Continuar/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(updateOnboardingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 3,
          goal: 'dream',
          goalDescription: 'Test Goal',
          goalValue: 5000,
        }),
      );
      expect(mockPush).toHaveBeenCalledWith('/onboarding/step3');
    });
  });
});
