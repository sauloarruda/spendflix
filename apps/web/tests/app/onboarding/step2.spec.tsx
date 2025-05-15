import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { getOnboardingAction, updateOnboardingAction } from '@/actions/onboarding';
import Page from '@/app/onboarding/step2/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/actions/onboarding', () => ({
  getOnboardingAction: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    step: 2,
    userId: 'test-user-id',
    goal: 'dream',
    goalDescription: 'Test Goal',
    goalValue: 5000,
  }),
  updateOnboardingAction: jest.fn().mockResolvedValue({
    id: 'test-onboarding-id',
    step: 3,
    userId: 'test-user-id',
    goal: 'dream',
    goalDescription: 'Test Goal',
    goalValue: 5000,
  }),
}));

// To avoid infinite loops. Investigate reason
jest.mock('@/components/LoadingForm', () => ({
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
      expect(screen.getByText(/Olá.*muito prazer!/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Qual é o seu sonho?/i)).toBeInTheDocument();
      expect(screen.getByText(/Quanto você precisa?/i)).toBeInTheDocument();
    });
  });

  it('should change form fields when selecting a different goal', async () => {
    (getOnboardingAction as jest.Mock).mockResolvedValueOnce({
      id: 'test-onboarding-id',
      step: 2,
      userId: 'test-user-id',
      goal: '',
      goalDescription: '',
      goalValue: null,
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(/Quero sair das dívidas/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Qual é a dívida?/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Quero sair das dívidas/i));
    await waitFor(() => {
      expect(screen.getByText(/Qual é a dívida?/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Quero realizar um sonho/i));
    await waitFor(() => {
      expect(screen.getByText(/Qual é o seu sonho?/i)).toBeInTheDocument();
    });
    const button = screen.getByRole('button', { name: /Continuar/i });
    expect(button).toBeDisabled();
  });

  it('should redirect to step 3 when continue button is clicked', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
    });
    const button = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(updateOnboardingAction).toHaveBeenCalledWith(
        TEST_ONBOARDING_ID,
        expect.objectContaining({
          step: 3,
          goal: 'dream',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith('/onboarding/step3');
    });
  });

  it('should handle API error gracefully', async () => {
    const mockGetOnboarding = getOnboardingAction as jest.Mock;
    mockGetOnboarding.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    render(<Page />);

    // Even with API error, the page should load normally
    await waitFor(() => {
      expect(screen.getByText(/Olá.*muito prazer!/i)).toBeInTheDocument();
      expect(screen.getByText(/Quero realizar um sonho/i)).toBeInTheDocument();
    });
  });
});
