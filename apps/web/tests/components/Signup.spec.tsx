import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { signupAction } from '@/actions/auth';
import { updateOnboardingAction } from '@/actions/onboarding';
import Signup from '@/components/Signup';

jest.mock('@/actions/auth', () => ({
  signupAction: jest.fn(),
}));

jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: jest.fn(),
}));

const mockOnSuccess = jest.fn();
const mockOnLoginRedirect = jest.fn();
const mockOnboardingUid = 'test-uid';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

const setupSignupTest = () => {
  const utils = render(<Signup onSuccess={mockOnSuccess} onLoginRedirect={mockOnLoginRedirect} />);
  const nameInput = screen.getByLabelText('Como podemos te chamar?');
  const emailInput = screen.getByLabelText('Seu melhor email');
  const submitButton = screen.getByRole('button', { name: 'Continuar' });

  return {
    ...utils,
    nameInput,
    emailInput,
    submitButton,
  };
};

const setupLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'onboardingUid') return mockOnboardingUid;
    if (key === 'email') return '';
    return null;
  });
};

const clearMocks = () => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.clear.mockClear();
};

describe('Signup Component', () => {
  beforeEach(() => {
    clearMocks();
  });

  describe('Rendering', () => {
    it('renders the signup form correctly', () => {
      setupSignupTest();

      expect(screen.getByText('Descubra, Organize, Realize')).toBeInTheDocument();
      expect(screen.getByText(/Em menos de 20 minutos/)).toBeInTheDocument();
      expect(screen.getByLabelText('Como podemos te chamar?')).toBeInTheDocument();
      expect(screen.getByLabelText('Seu melhor email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('disables submit button when form is invalid', () => {
      const { submitButton } = setupSignupTest();
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during signup', async () => {
      const mockSignup = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        });

      (signupAction as jest.Mock).mockImplementation(mockSignup);
      (updateOnboardingAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Enviando...')).not.toBeInTheDocument();
      });
      expect(signupAction).toHaveBeenCalledTimes(1);
      expect(updateOnboardingAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Flow', () => {
    beforeEach(() => {
      setupLocalStorage();
    });

    it('handles successful signup', async () => {
      (signupAction as jest.Mock).mockResolvedValueOnce(undefined);
      (updateOnboardingAction as jest.Mock).mockResolvedValueOnce(undefined);

      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(signupAction).toHaveBeenCalledWith('John Doe', 'john@example.com');
        expect(updateOnboardingAction).toHaveBeenCalledWith('test-uid', {
          step: 1,
        });
        expect(mockOnSuccess).toHaveBeenCalledWith('John Doe', 'john@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles existing user error', async () => {
      (signupAction as jest.Mock).mockRejectedValueOnce({ name: 'UsernameExistsException' });
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginRedirect).toHaveBeenCalledWith('john@example.com');
      });
    });

    it('displays error message for NotAuthorizedException', async () => {
      (signupAction as jest.Mock).mockRejectedValueOnce({ name: 'NotAuthorizedException' });
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Já existe um usuário com o email informado.')).toBeInTheDocument();
      });
    });

    it('displays error message for CodeDeliveryFailureException', async () => {
      (signupAction as jest.Mock).mockRejectedValueOnce({
        name: 'CodeDeliveryFailureException',
      });
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Erro ao enviar o código de confirmação. Verifique se o email digitado está correto.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('displays error message for TooManyRequestsException', async () => {
      (signupAction as jest.Mock).mockRejectedValueOnce({ name: 'TooManyRequestsException' });
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Muitas tentativas, tente novamente mais tarde.'),
        ).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      (signupAction as jest.Mock).mockRejectedValueOnce({ name: 'UnknownError' });
      const { nameInput, emailInput, submitButton } = setupSignupTest();

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro desconhecido')).toBeInTheDocument();
      });
    });
  });
});
