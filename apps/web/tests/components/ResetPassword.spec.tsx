import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { resetPasswordAction } from '@/actions/auth';
import ResetPassword from '@/components/ResetPassword';

jest.mock('@/actions/auth', () => ({
  resetPasswordAction: jest.fn(),
}));

const mockOnSuccess = jest.fn();
const TEST_EMAIL = 'john@example.com';
const TEST_CODE = '123456';
const TEST_PASSWORD = 'newPassword123';

const setupResetPasswordTest = () => {
  const utils = render(<ResetPassword email={TEST_EMAIL} onSuccess={mockOnSuccess} />);
  const codeInput = screen.getByLabelText('Código de verificação');
  const passwordInput = screen.getByLabelText('Nova senha');
  const submitButton = screen.getByRole('button', { name: 'Redefinir senha' });

  return {
    ...utils,
    codeInput,
    passwordInput,
    submitButton,
  };
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the reset password form correctly', () => {
      setupResetPasswordTest();

      expect(screen.getByRole('heading', { name: 'Redefinir senha' })).toBeInTheDocument();
      expect(
        screen.getByText('Informe o código de 6 dígitos enviado para seu email e sua nova senha.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Código de verificação')).toBeInTheDocument();
      expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Redefinir senha' })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables submit button when form is invalid', () => {
      const { submitButton } = setupResetPasswordTest();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde a validação ser concluída
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('validates code format requirements', async () => {
      const { codeInput } = setupResetPasswordTest();

      // Digite 5 dígitos (inválido)
      await userEvent.type(codeInput, '12345');
      await userEvent.tab();

      // Aguarde a exibição da mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/O código deve conter 6 dígitos/)).toBeInTheDocument();
      });

      // Teste com caracteres não numéricos
      await userEvent.clear(codeInput);
      await userEvent.type(codeInput, 'abcdef');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/O código deve conter 6 dígitos/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during password reset', async () => {
      const mockReset = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (resetPasswordAction as jest.Mock).mockImplementation(mockReset);

      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde o botão ficar habilitado
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await userEvent.click(submitButton);

      expect(screen.getByText('Redefinindo...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(resetPasswordAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Success Flow', () => {
    it('handles successful password reset', async () => {
      (resetPasswordAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde o botão ficar habilitado
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(resetPasswordAction).toHaveBeenCalledWith(TEST_EMAIL, TEST_CODE, TEST_PASSWORD);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message for CodeMismatchException', async () => {
      (resetPasswordAction as jest.Mock).mockRejectedValueOnce({ name: 'CodeMismatchException' });
      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde o botão ficar habilitado
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Código inválido')).toBeInTheDocument();
      });
    });

    it('displays error message for InvalidPasswordException', async () => {
      (resetPasswordAction as jest.Mock).mockRejectedValueOnce({
        name: 'InvalidPasswordException',
      });
      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde o botão ficar habilitado
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Senha inválida conforme a política de senhas'),
        ).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      (resetPasswordAction as jest.Mock).mockRejectedValueOnce({ name: 'UnknownError' });
      const { codeInput, passwordInput, submitButton } = setupResetPasswordTest();

      await userEvent.type(codeInput, TEST_CODE);
      await userEvent.tab();
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.tab();

      // Aguarde o botão ficar habilitado
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
      });
    });
  });
});
