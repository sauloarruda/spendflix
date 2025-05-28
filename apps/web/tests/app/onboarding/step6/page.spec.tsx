import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import { updateOnboardingAction } from '@/actions/onboarding';
import OnboardingStep6Page from '@/app/onboarding/step6/page';
// Import TabView and TabPanel for type checking if needed, but they will be mocked.

const mockRouterPush = jest.fn();
let mockResumeOnboardingOnResume: (onboarding: any, userId: number) => void = () => {};
let mockResumeOnboardingOnError: () => void = () => {}; // Added for completeness, though not used by component

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn().mockResolvedValue({}),
}));

jest.mock('primereact/tabview', () => ({
  TabView: ({ children, activeIndex, onTabChange, ...rest }: any) => (
    <div data-testid="tabview-mock" {...rest}>
      <button data-testid="tab-change-button" onClick={() => onTabChange({ index: (activeIndex + 1) % children.length })}>
        Switch Tab
      </button>
      {children.map((child: any, index: number) => (
        <div key={index} data-testid={`tabpanel-mock-${index}`} style={{ display: index === activeIndex ? 'block' : 'none' }}>
          {child.props.header}
          {child.props.children}
        </div>
      ))}
    </div>
  ),
  TabPanel: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
}));

jest.mock('@/components/onboarding/OnboardingNavigation', () => ({
  __esModule: true,
  default: ({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) => (
    <button data-testid="onboarding-navigation" onClick={onClick} disabled={disabled === true}>
      Continuar
    </button>
  ),
}));

jest.mock('@/components/onboarding/ResumeOnboarding', () => ({
  __esModule: true,
  default: ({
    children,
    onResume,
    // onError, // onError is not a prop of ResumeOnboarding in step6 page
    message,
  }: {
    children: React.ReactNode;
    onResume: (onboarding: any, userId: number) => void;
    // onError?: () => void;
    message: string;
  }) => {
    mockResumeOnboardingOnResume = onResume;
    // mockResumeOnboardingOnError = onError || (() => {}); 
    return (
      <div data-testid="resume-onboarding">
        <div data-testid="message">{message}</div>
        {children}
      </div>
    );
  },
}));

jest.mock('@/components/reports/ExpensesReport', () => ({
  __esModule: true,
  default: () => <div data-testid="expenses-report-mock">Expenses Report</div>,
}));

jest.mock('@/components/reports/RevenueReport', () => ({
  __esModule: true,
  default: () => <div data-testid="revenue-report-mock">Revenue Report</div>,
}));

// Reverted to aliased path, as this is what the component uses.
jest.mock('@/contexts/TransactionsContext', () => ({ 
  TransactionsProvider: ({ children }: { userId: number; children: React.ReactNode }) => (
    <div data-testid="transactions-provider-mock">{children}</div>
  ),
}));


const TEST_ONBOARDING_UID = 'test-onboarding-uid-step6';
const TEST_USER_ID = 789;

describe('OnboardingStep6Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_UID);
    mockResumeOnboardingOnResume = () => {}; // Reset before each test
    // mockResumeOnboardingOnError = () => {};
  });

  afterEach(() => {
    localStorage.removeItem('onboardingUid');
  });

  it('renders initial text content and enables continue button', () => {
    render(<OnboardingStep6Page />);
    expect(screen.getByText(/Parabéns!/)).toBeInTheDocument();
    expect(screen.getByText(/Agora suas finanças estão/)).toBeInTheDocument();
    expect(screen.getByTestId('message')).toHaveTextContent('Preparando para continuar...');
    // The continue button in step 6 is not disabled by any specific condition in the component
    expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
  });

  it('sets userId and renders reports when ResumeOnboarding.onResume is triggered', async () => {
    render(<OnboardingStep6Page />);
    
    // Initially, reports should not be there as userId is not set
    expect(screen.queryByTestId('transactions-provider-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tabview-mock')).not.toBeInTheDocument();

    await act(async () => {
      // Simulate ResumeOnboarding calling onResume.
      // For Step 6, onResume is synchronous in the component.
      // Although onResume is sync, the state update it causes (setUserId) will lead to a re-render.
      // Using await act for consistency with async operations that cause state updates.
      mockResumeOnboardingOnResume({} /* mock onboarding data */, TEST_USER_ID);
    });

    // After onResume, userId should be set, and reports should render
    await waitFor(() => {
      expect(screen.getByTestId('transactions-provider-mock')).toBeInTheDocument();
      expect(screen.getByTestId('tabview-mock')).toBeInTheDocument();
      expect(screen.getByTestId('revenue-report-mock')).toBeInTheDocument();
      expect(screen.getByText('Receitas')).toBeInTheDocument(); // Tab header
    });
  });

  it('allows switching tabs in TabView', async () => {
    render(<OnboardingStep6Page />);
    // Trigger onResume to set userId and render TabView
    act(() => { // onResume in step6 is sync, but triggers state update
       mockResumeOnboardingOnResume({}, TEST_USER_ID);
    });


    await waitFor(() => { // Wait for TabView to be in document
      expect(screen.getByTestId('tabview-mock')).toBeInTheDocument();
    });

    const tabSwitchButton = screen.getByTestId('tab-change-button');
    const revenueTabPanel = screen.getByTestId('tabpanel-mock-0'); // Receitas
    const expensesTabPanel = screen.getByTestId('tabpanel-mock-1'); // Despesas

    // Initially, Receitas tab (index 0) is active
    expect(revenueTabPanel).toBeVisible();
    expect(expensesTabPanel).not.toBeVisible();
    expect(screen.getByText('Receitas')).toBeVisible();


    act(() => {
      fireEvent.click(tabSwitchButton); // Switch to Despesas (index 1)
    });

    await waitFor(() => {
      expect(revenueTabPanel).not.toBeVisible();
      expect(expensesTabPanel).toBeVisible();
      expect(screen.getByText('Despesas')).toBeVisible();

    });

    act(() => {
      fireEvent.click(tabSwitchButton); // Switch back to Receitas (index 0)
    });

    await waitFor(() => {
      expect(revenueTabPanel).toBeVisible();
      expect(expensesTabPanel).not.toBeVisible();
      expect(screen.getByText('Receitas')).toBeVisible();
    });
  });


  it('calls updateOnboardingAction and navigates to step7 on handleContinue', async () => {
    render(<OnboardingStep6Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');

    // handleContinue is async due to updateOnboardingAction and router.push
    await act(async () => { 
      fireEvent.click(continueButton);
    });

    await waitFor(() => { // Wait for async updateOnboardingAction
      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, { step: 7 });
    });
    // router.push is called after updateOnboardingAction resolves
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step7');
  });
});
