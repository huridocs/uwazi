import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  TranslationContext as LocaleTranslationContext,
  TranslationType,
} from '#shared/translationType.js';

type IndexedContextValues = Record<string, string>;

type IndexedContext = Omit<LocaleTranslationContext, 'values'> & {
  values: IndexedContextValues;
};

type IndexedTranslations = Omit<TranslationType, 'contexts'> & {
  contexts?: IndexedContext[];
};

type LocaleContextInput = Omit<LocaleTranslationContext, 'values'> & {
  values?: IndexedContextValues;
};

type LocaleTranslationInput = Omit<TranslationType, 'contexts'> & {
  contexts?: LocaleContextInput[];
};

function flattenLocaleTranslation(translation: LocaleTranslationInput): TranslationEntryInput[] {
  if (!translation.locale) {
    throw new Error('translation to save should have a locale');
  }

  if (!translation.contexts?.length) {
    return [];
  }

  const language = translation.locale as LanguageISO6391;

  return translation.contexts.flatMap(context =>
    Object.entries(context.values || {})
      .filter(([, value]) => value)
      .map(([key, value]) => ({
        language,
        key,
        value,
        context: {
          type: context.type!,
          label: context.label!,
          id: context.id!,
        },
      }))
  );
}

function toValueMap(translations: { key: string; value: string }[]): Record<string, string> {
  const values: Record<string, string> = {};
  translations.forEach(translation => {
    values[translation.key] = translation.value;
  });
  return values;
}

export { flattenLocaleTranslation, toValueMap };
export type { IndexedContext, IndexedTranslations, LocaleTranslationInput };
