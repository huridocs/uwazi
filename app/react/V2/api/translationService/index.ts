import { ApiError, type RequestContext } from '#shared/apiClient/index.js';
import { apiClient } from '../client.js';
import type { ApiResponse } from '../ApiResponse.js';

type TranslateTextInput = {
  text: string;
  language_from: string;
  language_to: string;
};

const silent: RequestContext = { policies: { notification: false } };
const TRANSLATION_SLOTS = 2;
let activeSlots = 0;
const slotQueue: Array<() => void> = [];

const waitForSlot = (signal?: AbortSignal) =>
  new Promise<void>(resolve => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    let settled = false;
    let finish = () => undefined;
    const abortWait = () => {
      const index = slotQueue.indexOf(finish);
      if (index >= 0) slotQueue.splice(index, 1);
      finish();
    };
    finish = () => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abortWait);
      resolve();
    };
    slotQueue.push(finish);
    signal?.addEventListener('abort', abortWait, { once: true });
  });

const withSlot = async <T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal?.aborted && activeSlots >= TRANSLATION_SLOTS) await waitForSlot(signal);
  if (signal?.aborted) return task();
  activeSlots += 1;
  try {
    return await task();
  } finally {
    activeSlots -= 1;
    slotQueue.shift()?.();
  }
};

const cancelled = (): ApiResponse<string | undefined> => [
  undefined,
  new ApiError('Request cancelled', { kind: 'cancelled', status: 0 }),
];

const translateText = async (
  input: TranslateTextInput,
  ctx: RequestContext = silent
): Promise<ApiResponse<string | undefined>> =>
  withSlot(async () => {
    if (ctx.signal?.aborted) return cancelled();
    const [data, error] = await apiClient.postJson<{ translated_text?: string }>(
      'translationService',
      input,
      ctx
    );
    if (error) return [undefined, error];
    if (typeof data?.translated_text !== 'string') return [undefined];
    return [data.translated_text];
  }, ctx.signal);

const probeTranslationService = async (languageFrom: string, languageTo: string) => {
  const [text, error] = await translateText({
    text: 'ok',
    language_from: languageFrom,
    language_to: languageTo,
  });
  if (error?.kind === 'timeout' || error?.kind === 'network' || error?.kind === 'cancelled') {
    return true;
  }
  return Boolean(text) && !error;
};

export { translateText, probeTranslationService };
export type { TranslateTextInput };
