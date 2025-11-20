import { get } from "svelte/store";
import { _ } from "svelte-i18n";
import { API_ERROR_CODES, type ApiErrorCode } from "./errorCodes";

/**
 * Traduz um erro da API baseado no código retornado
 *
 * @param errorCode - Código de erro retornado pela API (ex: "user_exists")
 * @param fallbackMessage - Mensagem de fallback caso o código não seja mapeado
 * @returns Mensagem traduzida no idioma atual
 */
export function translateApiError(errorCode: string, fallbackMessage?: string): string {
	const translationKey = API_ERROR_CODES[errorCode as ApiErrorCode];

	if (translationKey) {
		const translated = get(_)(translationKey);
		// Se a tradução retornar a própria chave, significa que não foi encontrada
		if (translated !== translationKey) {
			return translated;
		}
	}

	// Fallback para mensagem genérica se código não mapeado
	if (fallbackMessage) {
		return fallbackMessage;
	}

	return get(_)("errors.unknown");
}
