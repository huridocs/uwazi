import { CSVLoader } from 'api/csv';
import * as os from 'os';
import { EnforcedWithId, WithId } from 'api/odm';
import settings from 'api/settings/settings';
import thesauri from 'api/thesauri/thesauri';
import path from 'path';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import { generateFileName } from 'api/files';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { DefaultTranslations } from 'api/i18n/defaultTranslations';
import { availableLanguages } from 'shared/languagesList';
import { errorLog } from 'api/log';
import { prettifyError } from 'api/utils/handleError';
import { ContextType } from 'shared/translationSchema';
import {
  createTranslationsV2,
  deleteTranslationsByContextIdV2,
  deleteTranslationsByLanguageV2,
  getTranslationsV2,
  getTranslationsV2ByContext,
  getTranslationsV2ByLanguage,
  updateContextV2,
  upsertTranslationsV2,
} from './v2_support';
import { tenants } from 'api/tenants';

function checkForMissingKeys(
  keyValuePairsPerLanguage: { [x: string]: { [k: string]: string } },
  translation: WithId<TranslationType>,
  valueDict: IndexedContextValues,
  contextId: string
) {
  if (!translation.locale) throw new Error('Translation local does not exist !');
  const missingKeys = Object.keys(keyValuePairsPerLanguage[translation.locale]).filter(
    key => !(key in valueDict)
  );
  if (missingKeys.length) {
    throw new Error(
      `Process is trying to update missing translation keys: ${translation.locale} - ${contextId} - ${missingKeys}.`
    );
  }
}

function prepareContexts(contexts: TranslationContext[] = []) {
  return contexts.map(context => ({
    ...context,
    type:
      context.id === 'System' || context.id === 'Filters' || context.id === 'Menu'
        ? 'Uwazi UI'
        : context.type,
    values: context.values
      ? context.values.reduce((values, value) => {
          if (value.key && value.value) {
            values[value.key] = value.value; //eslint-disable-line no-param-reassign
          }
          return values;
        }, {} as IndexedContextValues)
      : {},
  }));
}

function checkDuplicateKeys(
  context: TranslationContext | IndexedContext,
  values: TranslationValue[]
) {
  if (!values) return;

  const seen = new Set();
  values.forEach(value => {
    if (seen.has(value.key)) {
      throw new Error(
        `Process is trying to save repeated translation key ${value.key} in context ${context.id} (${context.type}).`
      );
    }
    seen.add(value.key);
  });
}

function processContextValues(context: TranslationContext | IndexedContext): TranslationContext {
  const processedValues: TranslationValue[] = [];

  if (context.values && !Array.isArray(context.values)) {
    const indexedValues: IndexedContextValues = context.values;
    Object.keys(indexedValues).forEach(key => {
      if (indexedValues[key]) {
        processedValues.push({ key, value: indexedValues[key] });
      }
    });
  }

  let values: TranslationValue[] = [];
  if (processedValues.length) {
    values = processedValues;
  }
  if (Array.isArray(context.values)) {
    values = context.values as TranslationValue[];
  }

  checkDuplicateKeys(context, values);

  return { ...context, values };
}

const propagateTranslation = async (
  translation: TranslationType,
  currentTranslationData: WithId<TranslationType>
) => {
  await (currentTranslationData.contexts || ([] as TranslationContext[])).reduce(
    async (promise: Promise<any>, context) => {
      await promise;

      const isPresentInTheComingData = (translation.contexts || []).find(
        _context => _context.id?.toString() === context.id?.toString()
      );

      if (isPresentInTheComingData && isPresentInTheComingData.type === 'Thesaurus') {
        const thesaurus = await thesauri.getById(context.id);

        const valuesChanged: IndexedContextValues = (isPresentInTheComingData.values || []).reduce(
          (changes, value) => {
            const currentValue = (context.values || []).find(v => v.key === value.key);
            if (currentValue?.key && currentValue.value !== value.value) {
              return { ...changes, [currentValue.key]: value.value } as IndexedContextValues;
            }
            return changes;
          },
          {} as IndexedContextValues
        );

        const changesMatchingDictionaryId = Object.keys(valuesChanged)
          .map(valueChanged => {
            const valueFound = (thesaurus?.values || []).find(v => v.label === valueChanged);
            if (valueFound?.id) {
              return { id: valueFound.id, value: valuesChanged[valueChanged] };
            }
            return null;
          })
          .filter(a => a) as { id: string; value: string }[];

        return Promise.all(
          changesMatchingDictionaryId.map(async change =>
            thesauri.renameThesaurusInMetadata(
              change.id,
              change.value,
              context.id,
              translation.locale
            )
          )
        );
      }
      return Promise.resolve([]);
    },
    Promise.resolve([])
  );
};

const translationTypeToIndexedTranslation = (translations: EnforcedWithId<TranslationType>[]) =>
  translations.map(
    translation =>
      ({
        ...translation,
        contexts: prepareContexts(translation.contexts),
      } as IndexedTranslations)
  );

export default {
  prepareContexts,
  async get(query: { locale?: string; context?: string } = {}) {
    const language = query.locale;

    if (query.context) {
      return translationTypeToIndexedTranslation(await getTranslationsV2ByContext(query.context));
    }

    if (language) {
      return translationTypeToIndexedTranslation(await getTranslationsV2ByLanguage(language));
    }

    return translationTypeToIndexedTranslation(await getTranslationsV2());
  },

  async save(translation: TranslationType | IndexedTranslations) {
    const translationToSave = {
      ...translation,
      contexts: translation.contexts && translation.contexts.map(processContextValues),
    } as TranslationType;

    const [currentTranslationData] = await getTranslationsV2ByLanguage(translation.locale);
    if (currentTranslationData) {
      await propagateTranslation(translationToSave, currentTranslationData);
    }
    await upsertTranslationsV2([translationToSave]);
    return translationToSave;
  },

  async updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: {
      [x: string]: { [k: string]: string };
    }
  ) {
    const { languages = [] } = await settings.get({}, 'languages');
    const languagesSet = new Set(languages.map(l => String(l.key)));

    const languagesToUpdate = Object.keys(keyValuePairsPerLanguage).filter(l =>
      languagesSet.has(l)
    );

    const translationsToUpdate = await Promise.all(
      languagesToUpdate.map(async language => {
        const [translation] = await getTranslationsV2ByLanguage(language);
        return translation;
      })
    );

    return Promise.all(
      translationsToUpdate.map(async translation => {
        if (!translation.locale) throw new Error('Translation local does not exist !');

        const context = (translation.contexts || []).find(c => c.id === contextId);
        if (!context) {
          return Promise.resolve();
        }
        const valueDict: IndexedContextValues = Object.fromEntries(
          (context.values || []).map(({ key, value }) => [key, value])
        );
        checkForMissingKeys(keyValuePairsPerLanguage, translation, valueDict, contextId);
        Object.entries(keyValuePairsPerLanguage[translation.locale]).forEach(([key, value]) => {
          valueDict[key] = value;
        });
        context.values = Object.entries(valueDict).map(([key, value]) => ({ key, value }));
        return this.save(translation);
      })
    );
  },

  async addContext(
    id: string,
    contextName: string,
    values: IndexedContextValues,
    type: ContextType
  ) {
    const translatedValues: TranslationValue[] = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });
    const result = await getTranslationsV2();

    await upsertTranslationsV2(
      result.map(translation => {
        // eslint-disable-next-line no-param-reassign
        translation.contexts = translation.contexts || [];
        translation.contexts.push({ id, label: contextName, values: translatedValues, type });
        return translation;
      })
    );

    return 'ok';
  },

  async deleteContext(contextId: string) {
    await deleteTranslationsByContextIdV2(contextId);
    return 'ok';
  },

  async updateContext(
    id: string,
    newContextName: string,
    keyNamesChanges: { [x: string]: string },
    deletedProperties: string[],
    values: IndexedContextValues
  ) {
    await updateContextV2(
      { id: id.toString(), label: newContextName },
      keyNamesChanges,
      deletedProperties,
      values
    );
    return 'ok';
  },

  async addLanguage(newLanguage: string) {
    const defaultLanguage = await settings.getDefaultLanguage();
    const [defaultTranslation] = await getTranslationsV2ByLanguage(defaultLanguage.key);
    const newLanguageTranslations = {
      ...defaultTranslation,
      locale: newLanguage,
      contexts: (defaultTranslation.contexts || []).map(({ _id, ...context }) => context),
    };

    await createTranslationsV2(newLanguageTranslations);
    const [result] = await getTranslationsV2ByLanguage(newLanguage);
    return result;
  },

  async removeLanguage(locale: string) {
    return deleteTranslationsByLanguageV2(locale);
  },

  async importPredefined(locale: string) {
    const translationsCsv = await DefaultTranslations.retrievePredefinedTranslations(locale);
    const tmpCsv = path.join(os.tmpdir(), generateFileName({ originalname: 'tmp-csv.csv' }));
    await pipeline(translationsCsv, createWriteStream(tmpCsv));
    const loader = new CSVLoader();
    await loader.loadTranslations(tmpCsv, 'System');
  },

  async availableLanguages() {
    let languagesWithTranslations: string[] = [];
    try {
      languagesWithTranslations = await DefaultTranslations.retrieveAvailablePredefinedLanguages();
    } catch (e) {
      errorLog.error(prettifyError(e));
      return availableLanguages;
    }
    return availableLanguages.map(language => ({
      ...language,
      translationAvailable: languagesWithTranslations.includes(language.key),
    }));
  },
};

export interface IndexedContextValues {
  [k: string]: string;
}

export interface IndexedContext extends Omit<TranslationContext, 'values'> {
  values: IndexedContextValues;
}

export interface IndexedTranslations extends Omit<TranslationType, 'contexts'> {
  contexts?: IndexedContext[];
}
