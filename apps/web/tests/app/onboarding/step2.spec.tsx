import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { getOnboardingAction, updateOnboardingAction } from '@/actions/onboarding';
import Page from '@/app/onboarding/step2/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/onboarding/step2',
}));

jest.mock('@/actions/onboarding', () => ({
  getOnboardingAction: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    data: {
      step: 2,
      name: 'Test User',
      goal: 'dream',
      goalDescription: 'Test Goal',
      goalValue: 5000,
    },
    userId: 'test-user-id',
  }),
  updateOnboardingAction: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    data: {
      step: 3,
      name: 'Test User',
      goal: 'dream',
      goalDescription: 'Test Goal',
      goalValue: 5000,
    },
    userId: 'test-user-id',
  }),
}));

// To avoid infinite loops. Investigate reason
jest.mock('@/components/utils/LoadingForm', () => ({
  __esModule: true,
  default: function MockLoadingForm({
    children,
    onLoad,
  }: {
    children: React.ReactNode;
    onLoad: () => Promise<void>;
    message: string;
  }) {
    React.useEffect(() => {
      onLoad();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="loading-form">{children}</div>;
  },
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

  it('should redirect to step1 if onboardingUid is not present', async () => {
    localStorage.clear(); // Ensure onboardingUid is not set

    render(<Page />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding/step1');
    });
  });

  it('should load user data and onboarding information on mount', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(getOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_ID);
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
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce({
      id: 'test-onboarding-id',
      data: {
        step: 2,
        name: 'Test User',
        goal: 'dream',
        goalDescription: 'Test Goal',
        goalValue: 5000,
      },
      userId: 'test-user-id',
    });

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
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce({
      id: 'test-onboarding-id',
      data: {
        step: 2,
        name: 'Test User',
        goal: '',
        goalDescription: '',
        goalValue: null,
      },
      userId: 'test-user-id',
    });

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

    const button = screen.getByRole('button', { name: /Continuar/i });
    expect(button).toBeDisabled();
  });

  it('should redirect to step 3 when continue button is clicked', async () => {
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce({
      id: 'test-onboarding-id',
      data: {
        step: 2,
        name: 'Test User',
        goal: 'dream',
        goalDescription: 'Test Goal',
        goalValue: 5000,
      },
      userId: 'test-user-id',
    });

    render(<Page />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Continuar/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(updateOnboardingAction).toHaveBeenCalledWith(
        TEST_ONBOARDING_ID,
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
