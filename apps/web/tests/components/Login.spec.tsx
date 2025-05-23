import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { loginAction } from '@/actions/auth';
import Login from '@/components/auth/Login';

jest.mock('@/actions/auth', () => ({
  loginAction: jest.fn(),
}));

const mockOnSuccess = jest.fn();
const TEST_EMAIL = 'john@example.com';
const TEST_PASSWORD = 'password123';

const setupLoginTest = () => {
  const utils = render(<Login onSuccess={mockOnSuccess} />);
  const emailInput = screen.getByLabelText('Email');
  const passwordInput = screen.getByLabelText('Senha');
  const submitButton = screen.getByRole('button', { name: 'Entrar' });
  const forgotPasswordLink = screen.getByText('Esqueci minha senha');

  return {
    ...utils,
    emailInput,
    passwordInput,
    submitButton,
    forgotPasswordLink,
  };
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the login form correctly', () => {
      setupLoginTest();

      expect(screen.getByText('Entre na sua conta')).toBeInTheDocument();
      expect(screen.getByText('Informe seu email e senha para entrar.')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      expect(screen.getByText('Esqueci minha senha')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables submit button when form is invalid', () => {
      const { submitButton } = setupLoginTest();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during login', async () => {
      const mockLogin = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (loginAction as jest.Mock).mockImplementation(mockLogin);

      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      expect(screen.getByText('Validando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Validando...')).not.toBeInTheDocument();
      });
      expect(loginAction).toHaveBeenCalledTimes(1);
    });

    it('sets loading state when clicking forgot password link', async () => {
      const { forgotPasswordLink, submitButton } = setupLoginTest();

      await userEvent.click(forgotPasswordLink);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Flow', () => {
    it('handles successful login', async () => {
      (loginAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(loginAction).toHaveBeenCalledWith(TEST_EMAIL, TEST_PASSWORD);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message for UserNotFoundException', async () => {
      (loginAction as jest.Mock).mockRejectedValueOnce({ name: 'UserNotFoundException' });
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Usuário não encontrado')).toBeInTheDocument();
      });
    });

    it('displays error message for InvalidPasswordException', async () => {
      (loginAction as jest.Mock).mockRejectedValueOnce({ name: 'InvalidPasswordException' });
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Usuário ou senha inválidos')).toBeInTheDocument();
      });
    });

    it('displays error message for NotAuthorizedException', async () => {
      (loginAction as jest.Mock).mockRejectedValueOnce({ name: 'NotAuthorizedException' });
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Usuário ou senha inválidos')).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      (loginAction as jest.Mock).mockRejectedValueOnce({ name: 'UnknownError' });
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
      });
    });

    it('displays generic error message when error has no name', async () => {
      (loginAction as jest.Mock).mockRejectedValueOnce(new Error('Some error'));
      const { emailInput, passwordInput, submitButton } = setupLoginTest();

      await userEvent.type(emailInput, TEST_EMAIL);
      await userEvent.type(passwordInput, TEST_PASSWORD);
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
      });
    });
  });
});
