import { CSVLoader } from 'api/csv';
import * as os from 'os';
import { WithId } from 'api/odm';
import settings from 'api/settings/settings';
import thesauri from 'api/thesauri/thesauri';
import path from 'path';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import { generateFileName } from 'api/files';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ContentsClient, GithubFileNotFound } from 'api/i18n/contentsClient';
import { availableLanguages } from 'shared/languagesList';
import { errorLog } from 'api/log';
import { prettifyError } from 'api/utils/handleError';
import { ContextType } from 'shared/translationSchema';
import model from './translationsModel';
import {
  createTranslationsV2,
  deleteTranslationsByContextIdV2,
  deleteTranslationsByLanguageV2,
  getTranslationsV2,
  migrateTranslationsToV2,
  upsertTranslationsV2,
} from './v2_support';

export class UITranslationNotAvailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UITranslationNotAvailable';
  }
}

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

function processContextValues(context: TranslationContext | IndexedContext) {
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

  return { ...context, values } as TranslationContext;
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

const update = async (translation: TranslationType | IndexedTranslations) => {
  const currentTranslationData = await model.getById(translation._id);
  if (!currentTranslationData) {
    throw new Error('currentTranslationData does not exist');
  }

  const processedTranslation: TranslationType & { contexts: TranslationContext[] } = {
    ...translation,
    contexts: (translation.contexts || []).map(processContextValues),
  };

  await propagateTranslation(processedTranslation, currentTranslationData);

  (currentTranslationData?.contexts || []).forEach(context => {
    const isPresentInTheComingData = processedTranslation.contexts.find(
      _context => _context.id?.toString() === context.id?.toString()
    );

    if (!isPresentInTheComingData) {
      processedTranslation.contexts.push(context);
    }
  });

  return model.save({
    ...processedTranslation,
    contexts: processedTranslation.contexts.map(processContextValues),
  });
};

export default {
  prepareContexts,
  async get(query: { _id?: string; locale?: string } = {}, selector = {}) {
    const alreadyMigrated = await migrateTranslationsToV2();
    if (alreadyMigrated) {
      return getTranslationsV2(query.locale);
    }
    const translations = await model.get(query, selector);
    return translations.map(
      translation =>
        ({
          ...translation,
          contexts: prepareContexts(translation.contexts),
        } as IndexedTranslations)
    );
  },

  async save(translation: TranslationType | IndexedTranslations) {
    const translationToSave = {
      ...translation,
      contexts: translation.contexts && translation.contexts.map(processContextValues),
    } as TranslationType;

    if (translation._id) {
      await upsertTranslationsV2(translationToSave);
      return update(translation);
    }

    await createTranslationsV2(translationToSave);

    return model.save(translationToSave);
  },

  async updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: {
      [x: string]: { [k: string]: string };
    }
  ) {
    const { languages = [] } = await settings.get({}, 'languages');
    const languagesSet = new Set(languages.map(l => l.key));
    const languagesToUpdate = Object.keys(keyValuePairsPerLanguage).filter(l =>
      languagesSet.has(l)
    );

    return Promise.all(
      (await model.get({ locale: { $in: languagesToUpdate } })).map(async translation => {
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
    const result = await model.get();
    await Promise.all(
      result.map(async translation => {
        // eslint-disable-next-line no-param-reassign
        translation.contexts = translation.contexts || [];
        translation.contexts.push({ id, label: contextName, values: translatedValues, type });
        return this.save(translation);
      })
    );
    return 'ok';
  },

  async deleteContext(id: string) {
    const results = await model.get();
    await Promise.all(
      results.map(async translation =>
        model.save({
          ...translation,
          contexts: (translation.contexts || []).filter(tr => tr.id !== id),
        })
      )
    );
    await deleteTranslationsByContextIdV2(id);
    return 'ok';
  },

  async updateContext(
    id: string,
    newContextName: string | undefined,
    keyNamesChanges: { [x: string]: string },
    deletedProperties: string[],
    values: IndexedContextValues,
    type?: ContextType
  ) {
    const translatedValues: TranslationValue[] = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });

    const [translations, defaultLanguage] = await Promise.all([
      model.get(),
      settings.getDefaultLanguage(),
    ]);
    await Promise.all(
      translations.map(async translation => {
        translation.contexts = translation.contexts || [];
        const context = translation.contexts.find(c => c.id?.toString() === id.toString());
        if (!context) {
          translation.contexts.push({
            id,
            label: newContextName,
            values: translatedValues,
            type,
          });
          return this.save(translation);
        }

        context.values = context.values || [];
        context.values = context.values.filter(v => !deletedProperties.includes(v.key || ''));
        context.type = type;

        Object.keys(keyNamesChanges).forEach(originalKey => {
          const newKey = keyNamesChanges[originalKey];
          context.values = context.values || [];
          const value = context.values.find(v => v.key === originalKey);
          if (value) {
            value.key = newKey;

            if (translation.locale === defaultLanguage.key) {
              value.value = newKey;
            }
          }
          if (!value) {
            context.values.push({ key: newKey, value: values[newKey] });
          }
        });

        Object.keys(values).forEach(key => {
          context.values = context.values || [];
          if (!context.values.find(v => v.key === key)) {
            context.values.push({ key, value: values[key] });
          }
        });

        context.label = newContextName;

        return this.save(translation);
      })
    );
    return 'ok';
  },

  async addLanguage(locale: string) {
    const [languageTranslationAlreadyExists] = await model.get({ locale });
    if (languageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const defaultLanguage = await settings.getDefaultLanguage();

    const [defaultTranslation] = await model.get({ locale: defaultLanguage.key });

    const newLanguageTranslations = {
      ...defaultTranslation,
      _id: undefined,
      locale,
      contexts: (defaultTranslation.contexts || []).map(({ _id, ...context }) => context),
    };

    await createTranslationsV2(newLanguageTranslations);

    return model.save(newLanguageTranslations);
  },

  async removeLanguage(locale: string) {
    await deleteTranslationsByLanguageV2(locale);
    return model.delete({ locale });
  },

  async importPredefined(locale: string) {
    const contentsClient = new ContentsClient();
    try {
      const translationsCsv = await contentsClient.retrievePredefinedTranslations(locale);
      const tmpCsv = path.join(os.tmpdir(), generateFileName({ originalname: 'tmp-csv.csv' }));
      await pipeline(translationsCsv, createWriteStream(tmpCsv));
      const loader = new CSVLoader();
      await loader.loadTranslations(tmpCsv, 'System');
    } catch (error) {
      if (error instanceof GithubFileNotFound) {
        throw new UITranslationNotAvailable(
          `Predefined translation for locale ${locale} is not available`
        );
      }
      throw error;
    }
  },

  async availableLanguages() {
    const contentsClient = new ContentsClient();
    let languagesWithTranslations: string[] = [];
    try {
      languagesWithTranslations = await contentsClient.retrieveAvailablePredefinedLanguages();
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
