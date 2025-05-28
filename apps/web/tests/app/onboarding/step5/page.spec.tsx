import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import { updateOnboardingAction } from '@/actions/onboarding';
import { autorizeAction } from '@/actions/serverActions';
import { getUncategorizedTransactionsAction } from '@/actions/transactions';
import OnboardingStep5Page from '@/app/onboarding/step5/page';
import { UncategorizedTransaction } from '@/modules/transactions';
import { getSessionCookie } from '@/utils/cookie';

const mockRouterPush = jest.fn();
let mockResumeOnboardingOnResume: (onboarding: any, userId: number) => Promise<void> = async () => {};
let mockResumeOnboardingOnError: () => void = () => {};
let mockUncategorizedTransactionsOnChange: (editedIds: string[]) => void = () => {};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/utils/cookie', () => ({
  getSessionCookie: jest.fn().mockReturnValue('test-session-cookie'),
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/actions/transactions', () => ({
  getUncategorizedTransactionsAction: jest.fn(),
}));

jest.mock('@/actions/serverActions', () => ({
  autorizeAction: jest.fn(async (cookie, action) => { // Ensure it's async
    return await action(); // Ensure promise from action is awaited and returned
  }), 
}));

// Mock for UncategorizedTransactions that renders transaction descriptions
jest.mock('@/components/forms/UncategorizedTransactions', () => ({
  __esModule: true,
  default: ({ transactions, onChange }: { transactions: UncategorizedTransaction[], onChange: (editedIds: string[]) => void }) => {
    mockUncategorizedTransactionsOnChange = onChange;
    return (
      <div data-testid="uncategorized-transactions-mock">
        <span>{transactions.length} transactions</span>
        {/* Render a specific item to wait for */}
        {transactions.map(t => <div key={t.id}>{t.description}</div>)}
        <button data-testid="simulate-edit-button" onClick={() => onChange(transactions.map(t => t.id))}>Simulate All Edited</button>
      </div>
    );
  },
}));

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

const TEST_ONBOARDING_UID = 'test-onboarding-uid-step5';
const TEST_USER_ID = 456;

const createMockTransactions = (count: number, baseDescription = "Transaction"): UncategorizedTransaction[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    date: new Date(),
    description: `${baseDescription} ${i + 1}`,
    amount: (i + 1) * 100,
    categoryId: null,
    accountId: `a${i + 1}`,
    accountName: `Acc${i + 1}`,
  }));
};

describe('OnboardingStep5Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_UID);
    // Default mock for getUncategorizedTransactionsAction in most tests
    (getUncategorizedTransactionsAction as jest.Mock).mockResolvedValue({
      categorizedPercent: 0.5,
      transactions: createMockTransactions(2, "DefaultTrx"), 
    });
  });

  afterEach(() => {
    localStorage.removeItem('onboardingUid');
  });

  it('renders, then loads transactions, and updates button state', async () => {
    render(<OnboardingStep5Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).not.toBeDisabled(); // Initial: result.transactions=[] -> enabled

    await act(async () => {
      // This await is crucial for the promise within onResume (handleLoadTransactions) to resolve
      await mockResumeOnboardingOnResume({}, TEST_USER_ID); 
    });

    // Wait for a specific piece of UI that indicates transactions are loaded
    await waitFor(() => expect(screen.getByText('DefaultTrx 1')).toBeInTheDocument());
    // Now that transactions are loaded (2 by default) and UI is updated, check button
    expect(continueButton).toBeDisabled(); // 2 tx, 0 edited -> disabled
  });

  it('updates edited state and checks continue button logic', async () => {
    render(<OnboardingStep5Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).not.toBeDisabled(); // Initial: enabled

    await act(async () => {
      await mockResumeOnboardingOnResume({}, TEST_USER_ID); // Loads 2 "DefaultTrx"
    });

    await waitFor(() => expect(screen.getByText('DefaultTrx 1')).toBeInTheDocument());
    expect(continueButton).toBeDisabled(); // After load: 2 tx, 0 edited -> disabled

    act(() => { 
      // Simulate editing the two "DefaultTrx" transactions that were loaded
      mockUncategorizedTransactionsOnChange(createMockTransactions(2, "DefaultTrx").map(t => t.id));
    });
    await waitFor(() => expect(continueButton).not.toBeDisabled()); // All 2 edited -> enabled
  });

  describe('shouldContinue logic', () => {
    const setupTestAndAssertButtonState = async (transactionsToLoad: UncategorizedTransaction[]) => {
      (getUncategorizedTransactionsAction as jest.Mock).mockResolvedValue({
        categorizedPercent: transactionsToLoad.length > 0 ? 0.5 : 1,
        transactions: transactionsToLoad,
      });
      render(<OnboardingStep5Page />);
      const continueButton = screen.getByTestId('onboarding-navigation');
      expect(continueButton).not.toBeDisabled(); // Initial state before onResume

      await act(async () => {
        await mockResumeOnboardingOnResume({}, TEST_USER_ID);
      });

      if (transactionsToLoad.length > 0) {
        // Wait for specific content from loaded transactions
        await waitFor(() => expect(screen.getByText(transactionsToLoad[0].description)).toBeInTheDocument());
        expect(continueButton).toBeDisabled(); // If tx > 0 and 0 edited -> disabled
      } else {
        // If 0 transactions loaded, it should remain enabled
        await waitFor(() => expect(screen.getByText('0 transactions')).toBeInTheDocument());
        expect(continueButton).not.toBeDisabled();
      }
    };

    it('enables continue if no transactions loaded', async () => {
      await setupTestAndAssertButtonState(createMockTransactions(0)); 
      // Further assertions after this point are on the already asserted state
      expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
    });

    it('enables continue if all transactions are edited', async () => {
      const transactions = createMockTransactions(3, "TestTrxAll");
      await setupTestAndAssertButtonState(transactions); // Button is now disabled (3 tx, 0 edited)

      act(() => {
        mockUncategorizedTransactionsOnChange(transactions.map(t => t.id)); // Edit all 3
      });
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
      });
    });

    it('enables continue if more than 10 transactions are edited', async () => {
      const transactions = createMockTransactions(15, "TestTrx10");
      await setupTestAndAssertButtonState(transactions); // Button disabled (15 tx, 0 edited)

      const editedIds = transactions.slice(0, 11).map(t => t.id); // Edit 11
      act(() => {
        mockUncategorizedTransactionsOnChange(editedIds);
      });
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
      });
    });

    it('disables continue if some (but not all and <10) transactions are unedited', async () => {
      const transactions = createMockTransactions(5, "TestTrxSome");
      await setupTestAndAssertButtonState(transactions); // Button disabled (5 tx, 0 edited)

      act(() => {
        mockUncategorizedTransactionsOnChange(transactions.slice(0, 2).map(t => t.id)); // Edit 2
      });
      await waitFor(() => { // Still disabled
        expect(screen.getByTestId('onboarding-navigation')).toBeDisabled();
      });
    });
  });

  it('calls updateOnboardingAction and navigates to step6 on handleContinue', async () => {
    // Use a specific description for transactions loaded in this test
    (getUncategorizedTransactionsAction as jest.Mock).mockResolvedValue({
      categorizedPercent: 0.5,
      transactions: createMockTransactions(2, "HandleContTrx"),
    });
    render(<OnboardingStep5Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).not.toBeDisabled(); // Initial

    await act(async () => {
      await mockResumeOnboardingOnResume({}, TEST_USER_ID); 
    });
    
    await waitFor(() => expect(screen.getByText("HandleContTrx 1")).toBeInTheDocument());
    expect(continueButton).toBeDisabled(); // After load (2 tx, 0 edited)

    act(() => { 
      // Edit the specific transactions that were loaded
      mockUncategorizedTransactionsOnChange(createMockTransactions(2, "HandleContTrx").map(t => t.id));
    });
    await waitFor(() => expect(continueButton).not.toBeDisabled()); // After edit

    act(() => {
      fireEvent.click(continueButton);
    });

    await waitFor(() => {
      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, { step: 6 });
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step6');
  });

  it('navigates to step1 if ResumeOnboarding calls onError', () => {
    render(<OnboardingStep5Page />);
    act(() => { // Wrap mock call in act as it might lead to state changes if component handles error states
      mockResumeOnboardingOnError();
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step1');
  });
});
