import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import { createAccountAction } from '@/actions/accounts';
import { updateOnboardingAction } from '@/actions/onboarding';
import { autorizeAction } from '@/actions/serverActions';
import OnboardingStep4Page from '@/app/onboarding/step4/page';
import { Account, SourceType } from '@/prisma';
import { getSessionCookie } from '@/utils/cookie';

const mockRouterPush = jest.fn();
let mockResumeOnboardingOnResume: (onboarding: any, userId: number) => Promise<void> = async () => {};
let mockResumeOnboardingOnError: () => void = () => {};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/utils/cookie', () => ({
  getSessionCookie: jest.fn().mockReturnValue('test-session-cookie'),
}));

jest.mock('@/actions/accounts', () => ({
  createAccountAction: jest.fn(),
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/actions/serverActions', () => ({
  autorizeAction: jest.fn((cookie, action) => action()), // Immediately invoke the action
}));

// This mock will be slightly adjusted to ensure onUpdate is correctly passed and callable per instance
const mockAccountAccordionInstances: Array<(months: number) => void> = [];
jest.mock('@/components/onboarding/AccountAccordion', () => {
  return {
    __esModule: true,
    default: ({ account, onUpdate }: { account: Account; onUpdate: (months: number) => void }) => {
      // Store this instance's onUpdate function
      const instanceIndex = mockAccountAccordionInstances.length;
      mockAccountAccordionInstances.push(onUpdate);

      return (
        <div data-testid={`account-accordion-${account.name}`}>
          <span>{account.name}</span>
          <button onClick={() => act(() => onUpdate(1)) } data-testid={`add-1-month-${account.id}`}>Add 1 Month for {account.name}</button>
          <button onClick={() => act(() => onUpdate(3)) } data-testid={`add-3-months-${account.id}`}>Add 3 Months for {account.name}</button>
        </div>
      );
    },
  };
});

jest.mock('@/components/onboarding/OnboardingNavigation', () => ({
  __esModule: true,
  default: ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <button data-testid="onboarding-navigation" onClick={onClick} disabled={disabled}>
      Continuar
    </button>
  ),
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
    onResume: (onboarding: any, userId: number) => Promise<void>;
    onError: () => void;
    message: string;
  }) => {
    mockResumeOnboardingOnResume = onResume;
    mockResumeOnboardingOnError = onError;
    return (
      <div data-testid="resume-onboarding">
        <div data-testid="message">{message}</div>
        {children}
      </div>
    );
  },
}));

const TEST_ONBOARDING_UID = 'test-onboarding-uid-step4';
const TEST_USER_ID = 123;

const mockNubankAccount: Account = {
  id: 'nubank-account-id',
  userId: TEST_USER_ID,
  bankNumber: '260',
  name: 'Conta Corrente',
  color: 'green-500',
  sourceType: SourceType.NUBANK_ACCOUNT_CSV,
  totalBalance: 0, totalRevenue: 0, totalExpense: 0, createdAt: new Date(), updatedAt: new Date(),
  transactionsDateRange: null, syncEnabled: false, syncId: null, syncStatus: null, syncLastSync: null, syncMessage: null,
};

const mockNubankCreditCard: Account = {
  id: 'nubank-cc-id',
  userId: TEST_USER_ID,
  bankNumber: '260',
  name: 'Cartão de Crédito',
  color: 'orange-500',
  sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
  totalBalance: 0, totalRevenue: 0, totalExpense: 0, createdAt: new Date(), updatedAt: new Date(),
  transactionsDateRange: null, syncEnabled: false, syncId: null, syncStatus: null, syncLastSync: null, syncMessage: null,
};

describe('OnboardingStep4Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_UID);
    mockAccountAccordionInstances.length = 0; // Clear instances

    (createAccountAction as jest.Mock)
      .mockResolvedValueOnce(mockNubankAccount)
      .mockResolvedValueOnce(mockNubankCreditCard);
  });

  afterEach(() => {
    localStorage.removeItem('onboardingUid');
  });

  it('renders initial text content', () => {
    render(<OnboardingStep4Page />);
    expect(screen.getByText('Prepare seus extratos')).toBeInTheDocument();
    expect(screen.getByText(/Para descobrir sobre suas finanças/)).toBeInTheDocument();
    expect(screen.getByTestId('message')).toHaveTextContent('Preparando para continuar...');
  });

  it('calls createAccountAction for Nubank accounts when ResumeOnboarding.onResume is triggered', async () => {
    render(<OnboardingStep4Page />);
    await act(async () => {
      await mockResumeOnboardingOnResume({} /* mock onboarding data */, TEST_USER_ID);
    });

    expect(getSessionCookie).toHaveBeenCalled();
    expect(autorizeAction).toHaveBeenCalledTimes(2);
    expect(createAccountAction).toHaveBeenCalledTimes(2);
    // ... (assertions for createAccountAction params remain the same)

    await waitFor(() => {
      expect(screen.getByTestId('account-accordion-Conta Corrente')).toBeInTheDocument();
      expect(screen.getByTestId('account-accordion-Cartão de Crédito')).toBeInTheDocument();
    });
  });

  it('updates monthsCount and enables continue button when AccountAccordion calls onUpdate', async () => {
    render(<OnboardingStep4Page />);
    await act(async () => {
      await mockResumeOnboardingOnResume({}, TEST_USER_ID);
    });

    await waitFor(() => {
      expect(screen.getByTestId(`add-1-month-${mockNubankAccount.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`add-3-months-${mockNubankCreditCard.id}`)).toBeInTheDocument();
    });
    
    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).toBeDisabled();

    // Use the specific button test IDs
    const addMonthButtonContaCorrente = screen.getByTestId(`add-1-month-${mockNubankAccount.id}`);
    act(() => {
      fireEvent.click(addMonthButtonContaCorrente); // monthsCount = 1
    });
    expect(continueButton).toBeDisabled();

    const add3MonthsButtonCartao = screen.getByTestId(`add-3-months-${mockNubankCreditCard.id}`);
    act(() => {
      fireEvent.click(add3MonthsButtonCartao); // monthsCount = 1 + 3 = 4
    });
    
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });

  it('calls updateOnboardingAction and navigates to step5 on handleContinue', async () => {
    render(<OnboardingStep4Page />);
    await act(async () => {
      await mockResumeOnboardingOnResume({}, TEST_USER_ID);
    });
    
    await waitFor(() => {
      // Ensure accordion buttons are present before clicking
      expect(screen.getByTestId(`add-3-months-${mockNubankAccount.id}`)).toBeInTheDocument();
    });

    // Simulate enough months to enable button
    const add3MonthsButtonContaCorrente = screen.getByTestId(`add-3-months-${mockNubankAccount.id}`);
    act(() => {
      fireEvent.click(add3MonthsButtonContaCorrente);
    });
        
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
    });

    const continueButton = screen.getByTestId('onboarding-navigation');
    act(() => {
      fireEvent.click(continueButton);
    });

    await waitFor(() => {
      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, { step: 5 });
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step5');
  });

  it('navigates to step1 if ResumeOnboarding calls onError', () => {
    render(<OnboardingStep4Page />);
    act(() => { // Though routing is sync, the trigger might be part of event system
      mockResumeOnboardingOnError();
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step1');
  });

  it('continue button should be disabled if monthsCount is less than 3', async () => {
    render(<OnboardingStep4Page />);
    await act(async () => {
      await mockResumeOnboardingOnResume({}, TEST_USER_ID);
    });

    await waitFor(() => {
      expect(screen.getByTestId(`add-1-month-${mockNubankAccount.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`add-1-month-${mockNubankCreditCard.id}`)).toBeInTheDocument();
    });

    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).toBeDisabled();

    const add1MonthCC = screen.getByTestId(`add-1-month-${mockNubankAccount.id}`);
    const add1MonthNuCC = screen.getByTestId(`add-1-month-${mockNubankCreditCard.id}`);

    act(() => {
      fireEvent.click(add1MonthCC); // monthsCount = 1
    });
    expect(continueButton).toBeDisabled();

    act(() => {
      fireEvent.click(add1MonthNuCC); // monthsCount = 1 + 1 = 2
    });
    expect(continueButton).toBeDisabled(); 

    // Click one more time to make it 3.
    // Need to re-get the button if the mock re-renders or provides new onUpdate instances,
    // but my current mock shares the onUpdate via mockAccountAccordionOnUpdate.
    // A better mock would be to store onUpdate per instance.
    // For now, clicking again on add1MonthCC will use its original onUpdate.
    act(() => {
      fireEvent.click(add1MonthCC); // monthsCount = 2 + 1 = 3
    });
        
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });
});
