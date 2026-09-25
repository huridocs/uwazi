import type { RequestContext } from '#shared/apiClient/index.js';
import { apiClient } from '../client.js';
import type { ApiResponse } from '../ApiResponse.js';

type TranslateTextInput = {
  text: string;
  language_from: string;
  language_to: string;
};

const silent: RequestContext = { policies: { notification: false } };

const translateText = async (
  input: TranslateTextInput,
  ctx: RequestContext = silent
): Promise<ApiResponse<string | undefined>> => {
  const [data, error] = await apiClient.postJson<{ translated_text?: string }>(
    'translationService',
    input,
    ctx
  );
  if (error) return [undefined, error];
  if (typeof data?.translated_text !== 'string') return [undefined];
  return [data.translated_text];
};

const probeTranslationService = async (languageFrom: string, languageTo: string) => {
  const [text, error] = await translateText({
    text: 'ok',
    language_from: languageFrom,
    language_to: languageTo,
  });
  return Boolean(text) && !error;
};

export { translateText, probeTranslationService };
export type { TranslateTextInput };
