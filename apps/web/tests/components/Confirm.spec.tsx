import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { confirmAction, signupAction } from '@/actions/auth';
import { updateOnboardingAction } from '@/actions/onboarding';

import Confirm from '@/components/Confirm';

jest.mock('@/actions/auth', () => ({
  confirmAction: jest.fn(),
  signupAction: jest.fn(),
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn(),
}));

const mockOnSuccess = jest.fn();
const mockName = 'John Doe';
const mockEmail = 'john@example.com';
const mockOnboardingUid = 'test-uid';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

const setupConfirmTest = () => {
  const utils = render(<Confirm name={mockName} email={mockEmail} onSuccess={mockOnSuccess} />);
  const codeInput = screen.getByLabelText('Código de confirmação');
  const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
  const resendButton = screen.getByRole('button', { name: 'Reenviar código' });

  return {
    ...utils,
    codeInput,
    confirmButton,
    resendButton,
  };
};

const setupLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'onboardingUid') return mockOnboardingUid;
    return null;
  });
};

const clearMocks = () => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.clear.mockClear();
};

describe('Confirm Component', () => {
  beforeEach(() => {
    clearMocks();
  });

  describe('Rendering', () => {
    it('renders the confirmation form correctly', () => {
      setupConfirmTest();

      expect(screen.getByText('Confirme seu email')).toBeInTheDocument();
      expect(screen.getByText(/Olá John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
      expect(screen.getByLabelText('Código de confirmação')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables confirm button when code is invalid', () => {
      const { confirmButton } = setupConfirmTest();
      expect(confirmButton).toBeDisabled();
    });

    it('enables confirm button when code is valid', async () => {
      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');

      expect(confirmButton).not.toBeDisabled();
    });

    it('shows error message for invalid code format', async () => {
      const { codeInput } = setupConfirmTest();

      await userEvent.type(codeInput, '12345');
      await userEvent.tab();

      expect(screen.getByText('Informe o código de 6 dígitos.')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during confirmation', async () => {
      const mockConfirm = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (confirmAction as jest.Mock).mockImplementation(mockConfirm);
      (updateOnboardingAction as jest.Mock).mockResolvedValueOnce(undefined);
      setupLocalStorage();

      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      expect(screen.getByText('Confirmando...')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();

      await waitFor(() => {
        expect(confirmAction).toHaveBeenCalledWith(mockEmail, '123456');
        expect(updateOnboardingAction).toHaveBeenCalledWith('test-uid', {
          step: 2,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets loading state when confirmation fails', async () => {
      (confirmAction as jest.Mock).mockImplementation(() =>
        Promise.reject(Object.assign(new Error('fail'), { name: 'UnknownError' })),
      );
      setupLocalStorage();

      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Ocorreu um erro ao confirmar o email.')).toBeInTheDocument();
        expect(confirmButton).not.toBeDisabled();
        expect(screen.getByText('Confirmar')).toBeInTheDocument();
      });
    });
  });

  describe('Success Flow', () => {
    beforeEach(() => {
      setupLocalStorage();
    });

    it('handles successful confirmation', async () => {
      (confirmAction as jest.Mock).mockResolvedValueOnce(undefined);
      (updateOnboardingAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmAction).toHaveBeenCalledWith(mockEmail, '123456');
        expect(updateOnboardingAction).toHaveBeenCalledWith('test-uid', {
          step: 2,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Resend Code', () => {
    it('handles successful code resend', async () => {
      (signupAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { resendButton } = setupConfirmTest();

      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(signupAction).toHaveBeenCalledWith(mockName, mockEmail);
      });
    });

    it('shows loading state during resend', async () => {
      const mockResend = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (signupAction as jest.Mock).mockImplementation(mockResend);

      const { resendButton } = setupConfirmTest();

      await userEvent.click(resendButton);

      expect(resendButton).toBeDisabled();

      await waitFor(() => {
        expect(resendButton).not.toBeDisabled();
      });
    });

    it('shows error when resend code fails', async () => {
      (signupAction as jest.Mock).mockImplementation(() =>
        Promise.reject(Object.assign(new Error('fail'), { name: 'ExpiredCodeException' })),
      );
      setupLocalStorage();

      const { resendButton } = setupConfirmTest();

      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'O código de confirmação digitado está expirado. Verifique seu email novamente ou solicite um novo código.',
          ),
        ).toBeInTheDocument();
        expect(resendButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message for ExpiredCodeException', async () => {
      (confirmAction as jest.Mock).mockRejectedValueOnce({ name: 'ExpiredCodeException' });
      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'O código de confirmação digitado está expirado. Verifique seu email novamente ou solicite um novo código.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('displays error message for UserNotFoundException', async () => {
      (confirmAction as jest.Mock).mockRejectedValueOnce({ name: 'UserNotFoundException' });
      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('O email cadastrado não foi encontrado.')).toBeInTheDocument();
      });
    });

    it('displays error message for CodeMismatchException', async () => {
      (confirmAction as jest.Mock).mockRejectedValueOnce({ name: 'CodeMismatchException' });
      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'O código de confirmação é inválido. Verifique seu email novamente ou solicite um novo código.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      (confirmAction as jest.Mock).mockRejectedValueOnce({ name: 'UnknownError' });
      const { codeInput, confirmButton } = setupConfirmTest();

      await userEvent.type(codeInput, '123456');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Ocorreu um erro ao confirmar o email.')).toBeInTheDocument();
      });
    });
  });
});
