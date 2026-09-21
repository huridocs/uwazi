import { apiClient } from '../client.js';
import type { ApiResponse } from '../ApiResponse.js';

type TranslateTextInput = {
  text: string;
  language_from: string;
  language_to: string;
};

const translateText = async (
  input: TranslateTextInput
): Promise<ApiResponse<string | undefined>> => {
  const [data, error] = await apiClient.postJson<{ translated_text?: string }>(
    'translationService',
    input
  );
  if (error) return [undefined, error];
  if (typeof data?.translated_text !== 'string') return [undefined];
  return [data.translated_text];
};

export { translateText };
export type { TranslateTextInput };
