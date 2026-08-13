import { EnforcedWithId } from '#api/odm/index.js';
import { TranslationContext, TranslationType } from '#shared/translationType.js';

export type IndexedContextValues = { [k: string]: string };

export type IndexedContext = Omit<TranslationContext, 'values'> & {
  values: IndexedContextValues;
};

export type IndexedTranslations = Omit<TranslationType, 'contexts'> & {
  contexts?: IndexedContext[];
};

export function prepareContexts(contexts: TranslationContext[] = []): IndexedContext[] {
  return contexts.map(context => {
    const values: IndexedContextValues = {};
    context.values?.forEach(value => {
      if (value.key && value.value) {
        values[value.key] = value.value;
      }
    });
    return {
      ...context,
      type:
        context.id === 'System' || context.id === 'Filters' || context.id === 'Menu'
          ? 'Uwazi UI'
          : context.type,
      values,
    };
  });
}

export function toIndexedTranslations(
  translations?: EnforcedWithId<TranslationType>[]
): IndexedTranslations[] {
  if (!translations) {
    return [];
  }

  return translations.map(translation => ({
    ...translation,
    contexts: prepareContexts(translation.contexts),
  }));
}
