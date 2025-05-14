import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { forgotPasswordAction } from '@/actions/auth';
import ForgotPassword from '@/components/ForgotPassword';

jest.mock('@/actions/auth', () => ({
  forgotPasswordAction: jest.fn(),
}));

const mockOnSuccess = jest.fn();
const TEST_EMAIL = 'john@example.com';

const setupForgotPasswordTest = () => {
  const utils = render(<ForgotPassword onSuccess={mockOnSuccess} />);
  const emailInput = screen.getByLabelText('Email');
  const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });

  return {
    ...utils,
    emailInput,
    submitButton,
  };
};

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the forgot password form correctly', () => {
      setupForgotPasswordTest();

      expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
      expect(
        screen.getByText('Informe seu email para receber instruções de como redefinir sua senha.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enviar instruções' })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables submit button when form is invalid', () => {
      const { submitButton } = setupForgotPasswordTest();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const { emailInput, submitButton } = setupForgotPasswordTest();

      await userEvent.type(emailInput, TEST_EMAIL);

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during password reset request', async () => {
      const mockForgotPassword = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (forgotPasswordAction as jest.Mock).mockImplementation(mockForgotPassword);

      const { emailInput, submitButton } = setupForgotPasswordTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.click(submitButton);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Enviando...')).not.toBeInTheDocument();
      });
      expect(forgotPasswordAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Flow', () => {
    it('handles successful password reset request', async () => {
      (forgotPasswordAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { emailInput, submitButton } = setupForgotPasswordTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(forgotPasswordAction).toHaveBeenCalledWith(TEST_EMAIL);
        expect(mockOnSuccess).toHaveBeenCalledWith(TEST_EMAIL);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message for UserNotFoundException', async () => {
      (forgotPasswordAction as jest.Mock).mockRejectedValueOnce({ name: 'UserNotFoundException' });
      const { emailInput, submitButton } = setupForgotPasswordTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Usuário não encontrado')).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      (forgotPasswordAction as jest.Mock).mockRejectedValueOnce({ name: 'UnknownError' });
      const { emailInput, submitButton } = setupForgotPasswordTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
      });
    });
  });
});
