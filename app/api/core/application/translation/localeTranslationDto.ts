import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  TranslationContext as LocaleTranslationContext,
  TranslationType,
  TranslationValue,
} from '#shared/translationType.js';

type IndexedContextValues = Record<string, string>;

type IndexedContext = Omit<LocaleTranslationContext, 'values'> & {
  values: IndexedContextValues;
};

type IndexedLocaleTranslation = Omit<TranslationType, 'contexts'> & {
  contexts?: IndexedContext[];
};

type LocaleTranslationInput = TranslationType | IndexedLocaleTranslation;

function checkDuplicateKeys(
  context: LocaleTranslationContext | IndexedContext,
  values: TranslationValue[]
) {
  if (!values) return;

  const seen = new Set<string | undefined>();
  values.forEach(value => {
    if (seen.has(value.key)) {
      throw new Error(
        `Process is trying to save repeated translation key ${value.key} in context ${context.id} (${context.type}).`
      );
    }
    seen.add(value.key);
  });
}

function indexedValuesToList(indexedValues: Record<string, string>): TranslationValue[] {
  return Object.keys(indexedValues)
    .filter(key => indexedValues[key])
    .map(key => ({ key, value: indexedValues[key] }));
}

function processContextValues(
  context: LocaleTranslationContext | IndexedContext
): LocaleTranslationContext {
  let values: TranslationValue[] = [];

  if (context.values && !Array.isArray(context.values)) {
    values = indexedValuesToList(context.values);
  } else if (Array.isArray(context.values)) {
    values = context.values as TranslationValue[];
  }

  checkDuplicateKeys(context, values);

  return { ...context, values };
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
