import type { paths } from '../types/api';

type SignupRequest = paths['/auth/signup']['post']['requestBody']['content']['application/json'];
type SignupError = paths['/auth/signup']['post']['responses']['400']['content']['application/json'];

type ConfirmRequest = paths['/auth/confirm']['post']['requestBody']['content']['application/json'];
export type ConfirmResultTokens =
  paths['/auth/confirm']['post']['responses']['200']['content']['application/json'];
type ConfirmError =
  paths['/auth/confirm']['post']['responses']['400']['content']['application/json'];

const API_AUTH_URL = process.env.NEXT_PUBLIC_API_AUTH_URL;

const SignupErrorMessages = {
  UsernameExistsException:
    'Já existe um usuário com o email informado. TODO: Redirecionando para login.',
  NotAuthorizedException: 'Já existe um usuário com o email informado.',
  CodeDeliveryFailureException:
    'Erro ao enviar o código de confirmação. Verifique se o email digitado está correto.',
  TooManyRequestsException: 'Muitas tentativas, tente novamente mais tarde.',
};

export type SignupResult = {
  success: boolean;
  error?: keyof typeof SignupErrorMessages | unknown;
  message?: string;
};

const ConfirmErrorMessages = {
  ExpiredCodeException:
    'O código de confirmação digitado está expirado. Verifique seu email novamente ou solicite um novo código.',
  UserNotFoundException: 'O email cadastrado não foi encontrado.',
  NotAuthorizedException:
    'Já existe um usuário com o email informado. TODO: Redirecionando para login.',
  CodeMismatchException:
    'O código de confirmação é inválido. Verifique seu email novamente ou solicite um novo código.',
};

export type ConfirmResult = {
  success: boolean;
  tokens?: ConfirmResultTokens;
  error?: keyof typeof ConfirmErrorMessages | unknown;
  message?: string;
};

const respondAsUnknownError = (error: unknown): SignupResult | ConfirmResult => {
  return { success: false, error, message: 'Não foi possível conectar.' };
};

async function signup(name: string, email: string): Promise<SignupResult> {
  try {
    const res = await fetch(`${API_AUTH_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email } as SignupRequest),
    });
    if (res.status === 201) {
      return { success: true };
    }
    const body = (await res.json()) as SignupError;
    return {
      success: false,
      error: body.error,
      message:
        SignupErrorMessages[body.error as keyof typeof SignupErrorMessages] ||
        'Ocorreu um erro ao gravar os dados.',
    };
  } catch (error: unknown) {
    return respondAsUnknownError(error);
  }
}

async function confirm(email: string, code: string): Promise<ConfirmResult> {
  try {
    const res = await fetch(`${API_AUTH_URL}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code } as ConfirmRequest),
    });
    if (res.status === 200) {
      const body = (await res.json()) as ConfirmResultTokens;
      return {
        success: true,
        tokens: body,
      };
    }
    const body = (await res.json()) as ConfirmError;
    return {
      success: false,
      error: body.error,
      message:
        ConfirmErrorMessages[body.error as keyof typeof ConfirmErrorMessages] ??
        'Ocorreu um erro ao confirmar o email.',
    };
  } catch (error: unknown) {
    return respondAsUnknownError(error);
  }
}

export { signup, confirm, SignupErrorMessages, ConfirmErrorMessages };
