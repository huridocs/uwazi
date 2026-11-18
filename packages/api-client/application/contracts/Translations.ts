import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { TranslationType } from '#shared/translationType.js';

/** GET /api/translations */
type LegacyTranslationsQuery = { context?: string; locale?: LanguageISO6391 };

type LegacyTranslationsResponse = { rows: TranslationType[] };

/** GET /api/v2/translations */
type TranslationEntry = {
  key: string;
  value: string;
  language: LanguageISO6391;
  context: { id: string; label: string; type: string };
};

type TranslationEntriesResponse = TranslationEntry[];

export type {
  LegacyTranslationsQuery,
  LegacyTranslationsResponse,
  TranslationEntry,
  TranslationEntriesResponse,
};
