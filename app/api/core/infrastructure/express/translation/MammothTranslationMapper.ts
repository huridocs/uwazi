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
  return contexts.map(context => ({
    ...context,
    type:
      context.id === 'System' || context.id === 'Filters' || context.id === 'Menu'
        ? 'Uwazi UI'
        : context.type,
    values: context.values
      ? context.values.reduce((values, value) => {
          if (value.key && value.value) {
            // eslint-disable-next-line no-param-reassign
            values[value.key] = value.value;
          }
          return values;
        }, {} as IndexedContextValues)
      : {},
  }));
}

export function toIndexedTranslations(
  translations?: EnforcedWithId<TranslationType>[]
): IndexedTranslations[] {
  return translations
    ? translations.map(
        translation =>
          ({
            ...translation,
            contexts: prepareContexts(translation.contexts),
          }) as IndexedTranslations
      )
    : [];
}
