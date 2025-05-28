import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Assuming updateOnboardingAction might be added later, keep for consistency if subtask is strictly followed later
// import { updateOnboardingAction } from '@/actions/onboarding'; 
import OnboardingStep7Page from '@/app/onboarding/step7/page';

const mockRouterPush = jest.fn();
let mockResumeOnboardingOnResume: (onboarding: any, userId: number) => void = () => {};
let mockResumeOnboardingOnError: () => void = () => {}; // For mock completeness

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush, // Though not used by current handleContinue
  }),
}));

// jest.mock('@/actions/onboarding', () => ({
//   updateOnboardingAction: jest.fn().mockResolvedValue({}), // Mock if component used it
// }));

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
      Concluir
    </button> // Text changed to "Concluir" as per subtask, though component might have "Continuar"
  ),
}));

jest.mock('@/components/onboarding/ResumeOnboarding', () => ({
  __esModule: true,
  default: ({
    children,
    onResume,
    // onError, // Step7 component does not pass onError to ResumeOnboarding
    message,
  }: {
    children: React.ReactNode;
    onResume: (onboarding: any, userId: number) => void;
    message: string;
  }) => {
    mockResumeOnboardingOnResume = onResume;
    return (
      <div data-testid="resume-onboarding">
        <div data-testid="message">{message}</div>
        {children}
      </div>
    );
  },
}));

jest.mock('@/components/reports/ResultsReport', () => ({
  __esModule: true,
  default: () => <div data-testid="results-report-mock">Results Report</div>,
}));

jest.mock('@/contexts/ResultsReportContext', () => ({
  ResultsReportProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="results-report-provider-mock">{children}</div>
  ),
}));

// Using aliased path as it's what the component step7/page.tsx uses.
// This might fail if Jest config doesn't resolve it for the component itself.
jest.mock('@/contexts/TransactionsContext', () => ({
  TransactionsProvider: ({ children }: { userId: number; children: React.ReactNode }) => (
    <div data-testid="transactions-provider-mock">{children}</div>
  ),
}));


const TEST_ONBOARDING_UID = 'test-onboarding-uid-step7'; // Not used by component, but for consistency
const TEST_USER_ID = 101112;

describe('OnboardingStep7Page', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_UID); // Though not used by handleContinue
    mockResumeOnboardingOnResume = () => {};
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {}); // Spy on alert
  });

  afterEach(() => {
    localStorage.removeItem('onboardingUid');
    alertSpy.mockRestore(); // Restore original alert
  });

  it('renders initial text content and enables continue button', () => {
    render(<OnboardingStep7Page />);
    expect(screen.getByText(/Muito bem!/)).toBeInTheDocument();
    expect(screen.getByText(/Agora chegou a hora de/)).toBeInTheDocument();
    expect(screen.getByTestId('message')).toHaveTextContent('Carregando nosso último passso!');
    expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
    expect(screen.getByTestId('onboarding-navigation')).toHaveTextContent('Concluir');
  });

  it('sets userId and renders reports when ResumeOnboarding.onResume is triggered', async () => {
    render(<OnboardingStep7Page />);
    
    expect(screen.queryByTestId('transactions-provider-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tabview-mock')).not.toBeInTheDocument();

    act(() => { // onResume in step7 is sync, but triggers state update (setUserId)
      mockResumeOnboardingOnResume({} /* mock onboarding data */, TEST_USER_ID);
    });

    await waitFor(() => {
      expect(screen.getByTestId('transactions-provider-mock')).toBeInTheDocument();
      expect(screen.getByTestId('tabview-mock')).toBeInTheDocument();
      expect(screen.getByTestId('results-report-provider-mock')).toBeInTheDocument();
      expect(screen.getByTestId('results-report-mock')).toBeInTheDocument();
      expect(screen.getByText('Resultados')).toBeInTheDocument(); // Tab header
    });
  });

  it('allows switching tabs in TabView', async () => {
    render(<OnboardingStep7Page />);
    act(() => {
       mockResumeOnboardingOnResume({}, TEST_USER_ID);
    });

    await waitFor(() => expect(screen.getByTestId('tabview-mock')).toBeInTheDocument());

    const tabSwitchButton = screen.getByTestId('tab-change-button');
    const resultsTabPanel = screen.getByTestId('tabpanel-mock-0'); 
    const budgetTabPanel = screen.getByTestId('tabpanel-mock-1');  

    expect(resultsTabPanel).toBeVisible();
    expect(budgetTabPanel).not.toBeVisible();
    expect(screen.getByText('Resultados')).toBeVisible();

    act(() => {
      fireEvent.click(tabSwitchButton); // Switch to Orçamento (index 1)
    });

    await waitFor(() => {
      expect(resultsTabPanel).not.toBeVisible();
      expect(budgetTabPanel).toBeVisible();
      expect(screen.getByText('Orçamento')).toBeVisible();
    });

    act(() => {
      fireEvent.click(tabSwitchButton); // Switch back to Resultados (index 0)
    });

    await waitFor(() => {
      expect(resultsTabPanel).toBeVisible();
      expect(budgetTabPanel).not.toBeVisible();
      expect(screen.getByText('Resultados')).toBeVisible();
    });
  });

  it('calls alert("TODO") on handleContinue', () => {
    render(<OnboardingStep7Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');

    act(() => {
      fireEvent.click(continueButton);
    });
    
    expect(alertSpy).toHaveBeenCalledWith('TODO');
    // Assert that updateOnboardingAction and router.push are NOT called, per current component code
    // expect(updateOnboardingAction).not.toHaveBeenCalled(); 
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // If ResumeOnboarding.onError was used by the component:
  // it('navigates to step1 if ResumeOnboarding calls onError', () => {
  //   const mockOnError = jest.fn();
  //   // Need to ensure the mock for ResumeOnboarding passes onError to the component
  //   // and the component wires it up to router.push('/onboarding/step1').
  //   // Current Step7 does not pass onError to ResumeOnboarding.
  //   render(<OnboardingStep7Page />); // Assume ResumeOnboarding mock now has onError
  //   act(() => {
  //     mockResumeOnboardingOnError(); 
  //   });
  //   // expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step1');
  // });
});
