import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as React from 'react';

import { updateOnboardingAction } from '@/actions/onboarding';
import OnboardingStep3Page from '@/app/onboarding/step3/page';
import OnboardingContext, { OnboardingContextType } from '@/contexts/OnboardingContext';

const mockRouterPush = jest.fn();
const mockConfirmDialog = jest.fn();
let capturedMultiSelectOnChange: (event: { value: string[] }) => void = () => {};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Refined next/image mock
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt,
    src,
    className,
    style,
    ...restProps
  }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const imageProps: React.ImgHTMLAttributes<HTMLImageElement> = {
      alt: alt || '',
      src: src as string,
      className,
      style,
      ...restProps,
    };
    return <img {...imageProps} />;
  },
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn().mockResolvedValue({}),
}));

// Refined MultiSelect mock
jest.mock('primereact/multiselect', () => ({
  MultiSelect: (props: Record<string, unknown>) => {
    capturedMultiSelectOnChange = props.onChange as (event: { value: string[] }) => void;
    const { value, className, style, id, ...rest } = props;
    return (
      <div
        data-testid="multiselect-other-banks-container"
        className={className as string}
        style={style as React.CSSProperties}
        id={id as string}
        {...rest}
      >
        <span data-testid="multiselect-value-display">
          Selected: {value && Array.isArray(value) ? value.join(', ') : 'None'}
        </span>
      </div>
    );
  },
}));

jest.mock('primereact/confirmdialog', () => ({
  ConfirmDialog: (props: Record<string, unknown>) => (
    <div data-testid="confirm-dialog" {...props} />
  ),
  confirmDialog: (props: Record<string, unknown>) => mockConfirmDialog(props),
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
    onError,
    message,
  }: {
    children: React.ReactNode;
    onError?: () => void;
    message: string;
  }) => (
    <div data-testid="resume-onboarding">
      {message && <div>{message}</div>}
      {children}
      {onError && (
        <button data-testid="resume-onboarding-error" onClick={onError}>
          Trigger Error
        </button>
      )}
    </div>
  ),
}));

const TEST_ONBOARDING_UID = 'test-onboarding-uid-step3';

// Use new data-testid based helper
const getBankCard = (name: string) => screen.getByTestId(`bank-card-${name}`);

// Add a mock context provider
const mockContextValue: OnboardingContextType = {
  isLoadingOnboarding: false,
  userId: 1,
  onboardingData: {},
  updateOnboarding: async (data) => {
    const onboardingUid = localStorage.getItem('onboardingUid');
    if (onboardingUid) {
      await updateOnboardingAction(onboardingUid, data);
    }
  },
  finishOnboarding: jest.fn().mockResolvedValue(undefined),
};

function renderWithProvider(ui: React.ReactElement, contextValue = mockContextValue) {
  return render(<OnboardingContext.Provider value={contextValue}>{ui}</OnboardingContext.Provider>);
}

describe('OnboardingStep3Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    mockConfirmDialog.mockClear();
    localStorage.setItem('onboardingUid', TEST_ONBOARDING_UID);
    mockConfirmDialog.mockImplementation(() => ({ accept: jest.fn(), reject: jest.fn() }));
    capturedMultiSelectOnChange = () => {};
  });

  afterEach(() => {
    localStorage.removeItem('onboardingUid');
  });

  it('renders the heading and main bank options', () => {
    renderWithProvider(<OnboardingStep3Page />);
    expect(screen.getByText('Quais bancos você usa no dia a dia?')).toBeInTheDocument();
    expect(screen.getByTestId('bank-card-Nubank')).toBeInTheDocument();
    expect(screen.getByTestId('bank-card-Itaú')).toBeInTheDocument();
    expect(screen.getByTestId('bank-card-Outro')).toBeInTheDocument();
  });

  it('toggles selection of main banks and enables/disables continue button', async () => {
    renderWithProvider(<OnboardingStep3Page />);
    const nubankCard = getBankCard('Nubank');
    const continueButton = screen.getByTestId('onboarding-navigation');

    expect(continueButton).toBeDisabled();

    act(() => {
      fireEvent.click(nubankCard);
    });
    await waitFor(() => expect(nubankCard).toHaveClass('border-primary'));
    expect(continueButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(nubankCard);
    });
    await waitFor(() => expect(nubankCard).not.toHaveClass('border-primary'));
    expect(continueButton).toBeDisabled();
  });

  it('shows multiselect on "Outro" click, and selection enables continue button', async () => {
    renderWithProvider(<OnboardingStep3Page />);
    const otherCard = getBankCard('Outro');

    act(() => {
      fireEvent.click(otherCard);
    });
    await waitFor(() =>
      expect(screen.getByTestId('multiselect-other-banks-container')).toBeInTheDocument(),
    );

    act(() => {
      capturedMultiSelectOnChange({ value: ['246'] });
    });

    await waitFor(() => {
      expect(screen.getByTestId('multiselect-value-display')).toHaveTextContent('246');
      expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
    });
  });

  describe('handleContinue scenarios', () => {
    const selectBanks = async (mainBankNames: string[], otherBankCodes: string[]) => {
      mainBankNames.forEach((name) => {
        act(() => {
          fireEvent.click(getBankCard(name));
        });
      });
      if (otherBankCodes.length > 0) {
        act(() => {
          fireEvent.click(getBankCard('Outro'));
        });
        await waitFor(() =>
          expect(screen.getByTestId('multiselect-other-banks-container')).toBeInTheDocument(),
        );
        act(() => {
          capturedMultiSelectOnChange({ value: otherBankCodes });
        });
        await waitFor(() =>
          expect(screen.getByTestId('multiselect-value-display')).toHaveTextContent(
            otherBankCodes.join(','),
          ),
        );
      }
      await waitFor(() => {}); // Ensure state updates propagate
    };

    it('does not call update action if onboardingUid is missing', async () => {
      localStorage.removeItem('onboardingUid');
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks(['Nubank'], []);
      const continueButton = screen.getByTestId('onboarding-navigation');
      // Button should be enabled because a bank is selected
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).not.toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('Scenario: Only Nubank selected -> navigates to step4', async () => {
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks(['Nubank'], []);
      const continueButton = screen.getByTestId('onboarding-navigation');
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, {
        banks: ['260'],
        step: 4,
      });
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step4');
      expect(mockConfirmDialog).not.toHaveBeenCalled();
    });

    it('Scenario: Nubank + Other selected -> shows dialog, accepts -> navigates to step4', async () => {
      mockConfirmDialog.mockImplementationOnce((props: Record<string, unknown>) => {
        (props as { accept: () => void }).accept();
      });
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks(['Nubank'], ['025']);
      const continueButton = screen.getByTestId('onboarding-navigation');
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).toHaveBeenNthCalledWith(1, TEST_ONBOARDING_UID, {
        banks: expect.arrayContaining(['260', '025']),
        step: 4,
      });
      expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
      expect(mockConfirmDialog.mock.calls[0][0].message).toContain(
        'Atualmente só suportamos Nubank.',
      );
      expect(updateOnboardingAction).toHaveBeenNthCalledWith(2, TEST_ONBOARDING_UID, {
        step: 4,
      });
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step4');
    });

    it('Scenario: Nubank + Other selected -> shows dialog, rejects -> navigates to waitlist', async () => {
      mockConfirmDialog.mockImplementationOnce((props: Record<string, unknown>) => {
        (props as { reject: () => void }).reject();
      });
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks(['Nubank'], ['025']);
      const continueButton = screen.getByTestId('onboarding-navigation');
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, {
        banks: expect.arrayContaining(['260', '025']),
        step: 4,
      });
      expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
      expect(updateOnboardingAction).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/waitlist');
    });

    it('Scenario: Only Other (non-Nubank) selected -> shows dialog, accepts -> navigates to waitlist', async () => {
      mockConfirmDialog.mockImplementationOnce((props: Record<string, unknown>) => {
        (props as { accept: () => void }).accept();
      });
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks([], ['025']);
      const continueButton = screen.getByTestId('onboarding-navigation');
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, {
        banks: ['025'],
        step: 4,
      });
      expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
      expect(mockConfirmDialog.mock.calls[0][0].message).toContain(
        'Infelizmente ainda não suportamos os bancos selecionados.',
      );
      expect(updateOnboardingAction).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/waitlist');
    });

    it('Scenario: Only Other (non-Nubank) selected -> shows dialog, rejects -> navigates to decline', async () => {
      mockConfirmDialog.mockImplementationOnce((props: Record<string, unknown>) => {
        (props as { reject: () => void }).reject();
      });
      renderWithProvider(<OnboardingStep3Page />);
      await selectBanks([], ['025']);
      const continueButton = screen.getByTestId('onboarding-navigation');
      await waitFor(() => expect(continueButton).not.toBeDisabled());

      await act(async () => {
        fireEvent.click(continueButton);
      });

      expect(updateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, {
        banks: ['025'],
        step: 4,
      });
      expect(mockConfirmDialog).toHaveBeenCalledTimes(1);
      expect(updateOnboardingAction).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/decline');
    });
  });

  it('disables continue button when no banks are selected', () => {
    renderWithProvider(<OnboardingStep3Page />);
    const continueButton = screen.getByTestId('onboarding-navigation');
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button when a main bank is selected', async () => {
    renderWithProvider(<OnboardingStep3Page />);
    const nubankCard = getBankCard('Nubank');
    act(() => {
      fireEvent.click(nubankCard);
    });
    const continueButton = screen.getByTestId('onboarding-navigation');
    await waitFor(() => expect(continueButton).not.toBeDisabled());
  });

  it('enables continue button when an "other" bank is selected', async () => {
    renderWithProvider(<OnboardingStep3Page />);
    const otherCard = getBankCard('Outro');
    act(() => {
      fireEvent.click(otherCard);
    });
    await waitFor(() =>
      expect(screen.getByTestId('multiselect-other-banks-container')).toBeInTheDocument(),
    );
    act(() => {
      capturedMultiSelectOnChange({ value: ['246'] });
    });
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-navigation')).not.toBeDisabled();
    });
  });
});
