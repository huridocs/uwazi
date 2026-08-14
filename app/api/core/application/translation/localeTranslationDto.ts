import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  TranslationContext as LocaleTranslationContext,
  TranslationType,
  TranslationValue,
} from '#shared/translationType.js';

type IndexedContextValues = Record<string, string>;

type LocaleContextInput = Omit<LocaleTranslationContext, 'values'> & {
  values?: IndexedContextValues;
};

type LocaleTranslationInput = Omit<TranslationType, 'contexts'> & {
  contexts?: LocaleContextInput[];
};

function indexedValuesToList(indexedValues: Record<string, string>): TranslationValue[] {
  return Object.keys(indexedValues)
    .filter(key => indexedValues[key])
    .map(key => ({ key, value: indexedValues[key] }));
}

function processContextValues(context: LocaleContextInput): LocaleTranslationContext {
  return {
    ...context,
    values: indexedValuesToList(context.values || {}),
  };
}

function prepareLocaleTranslation(translation: LocaleTranslationInput): TranslationType {
  if (!translation.locale) {
    throw new Error('translation to save should have a locale');
  }

  return {
    ...translation,
    contexts: translation.contexts && translation.contexts.map(processContextValues),
  };
}

function flattenLocaleTranslation(translation: TranslationType): TranslationEntryInput[] {
  if (!translation.contexts?.length || !translation.locale) {
    return [];
  }

  return translation.contexts.reduce<TranslationEntryInput[]>((flatTranslations, context) => {
    if (context.values) {
      context.values.forEach(contextValue => {
        flatTranslations.push({
          language: translation.locale as LanguageISO6391,
          key: contextValue.key!,
          value: contextValue.value!,
          context: { type: context.type!, label: context.label!, id: context.id! },
        });
      });
    }
    return flatTranslations;
  }, []);
}

export { prepareLocaleTranslation, flattenLocaleTranslation };
export type { LocaleTranslationInput };
