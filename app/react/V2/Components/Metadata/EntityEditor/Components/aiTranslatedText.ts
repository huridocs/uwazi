type TranslationWriteOrigin = 'user' | 'translation';

const AI_TRANSLATED_MARKER = '(AI translated)';
const AI_TRANSLATED_PREFIX = `${AI_TRANSLATED_MARKER} `;

const isAiTranslated = (value: string) => value.startsWith(AI_TRANSLATED_MARKER);

const prependAiTranslated = (value: string) => {
  if (!value || isAiTranslated(value)) return value;
  return `${AI_TRANSLATED_PREFIX}${value}`;
};

const stripAiTranslated = (value: string) =>
  value.startsWith(AI_TRANSLATED_PREFIX) ? value.slice(AI_TRANSLATED_PREFIX.length) : value;

export { isAiTranslated, prependAiTranslated, stripAiTranslated };
export type { TranslationWriteOrigin };
