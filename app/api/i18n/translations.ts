import { CSVLoader } from 'api/csv';
import { generateFileName } from 'api/files';
import { CreateTranslationsData } from 'api/i18n.v2/services/CreateTranslationsService';
import { DefaultTranslations } from 'api/i18n/defaultTranslations';
import { errorLog } from 'api/log';
import { EnforcedWithId, WithId } from 'api/odm';
import settings from 'api/settings/settings';
import thesauri from 'api/thesauri/thesauri';
import { prettifyError } from 'api/utils/handleError';
import * as os from 'os';
import path from 'path';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import { ObjectId } from 'mongodb';
import { availableLanguages } from 'shared/languagesList';
import { ContextType } from 'shared/translationSchema';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { pipeline } from 'stream/promises';
import model from './translationsModel';
import {
  addLanguageV2,
  deleteTranslationsByContextIdV2,
  deleteTranslationsByLanguageV2,
  getTranslationsV2,
  getTranslationsV2ByContext,
  getTranslationsV2ByLanguage,
  migrateTranslationsToV2,
  updateContextV2,
  upsertTranslationsV2,
} from './v2_support';

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

const translationTypeToIndexedTranslation = (translations?: EnforcedWithId<TranslationType>[]) =>
  translations
    ? translations.map(
        translation =>
          ({
            ...translation,
            contexts: prepareContexts(translation.contexts),
          }) as IndexedTranslations
      )
    : [];

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

  async get(query: { locale?: LanguageISO6391; context?: string } = {}) {
    const alreadyMigrated = await migrateTranslationsToV2();
    if (alreadyMigrated) {
      const language = query.locale;

      if (query.context) {
        return translationTypeToIndexedTranslation(await getTranslationsV2ByContext(query.context));
      }

      if (language) {
        return translationTypeToIndexedTranslation(await getTranslationsV2ByLanguage(language));
      }

      return translationTypeToIndexedTranslation(await getTranslationsV2());
    }

    const { context, ...actualQuery } = query;
    const translations = await model.get(actualQuery, {
      ...(context ? { locale: 1 } : {}),
      ...(context ? { contexts: { $elemMatch: { id: context } } } : {}),
    });

    return translationTypeToIndexedTranslation(translations);
  },

  async oldSave(translation: TranslationType | IndexedTranslations) {
    const translationToSave = {
      ...translation,
      contexts: translation.contexts && translation.contexts.map(processContextValues),
    } as TranslationType;

    const [oldTranslationExists] = await model.get({ locale: translation.locale });
    if (oldTranslationExists) {
      return update({ _id: oldTranslationExists._id, ...translation });
    }

    return model.save(translationToSave);
  },

  async save(translation: TranslationType | IndexedTranslations) {
    const result = await this.oldSave(translation);
    await upsertTranslationsV2([result]);
    return result;
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
    ) as LanguageISO6391[];

    const translationsToUpdate = await Promise.all(
      languagesToUpdate.map(async language => {
        const [translation] =
          (await getTranslationsV2ByLanguage(language)) || (await model.get({ locale: language }));
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
    id: string | ObjectId,
    contextName: string,
    values: IndexedContextValues,
    type: ContextType
  ) {
    const translatedValues: TranslationValue[] = [];
    Object.keys(values).forEach(key => {
      translatedValues.push({ key, value: values[key] });
    });

    const legacyTranslations = await model.get();

    await Promise.all(
      legacyTranslations.map(async translation => {
        // eslint-disable-next-line no-param-reassign
        translation.contexts = translation.contexts || [];
        translation.contexts.push({
          id: id.toString(),
          label: contextName,
          values: translatedValues,
          type,
        });
        return this.oldSave(translation);
      })
    );

    const result = await getTranslationsV2();
    await upsertTranslationsV2(
      result.map(translation => {
        // eslint-disable-next-line no-param-reassign
        translation.contexts = translation.contexts || [];
        translation.contexts.push({
          id: id.toString(),
          label: contextName,
          values: translatedValues,
          type,
        });
        return translation;
      })
    );

    return 'ok';
  },

  async deleteContext(contextId: string) {
    const results = await model.get();
    await Promise.all(
      results.map(async translation =>
        model.save({
          ...translation,
          contexts: (translation.contexts || []).filter(tr => tr.id !== contextId),
        })
      )
    );
    await deleteTranslationsByContextIdV2(contextId);
    return 'ok';
  },

  async updateContext(
    context: CreateTranslationsData['context'],
    keyNamesChanges: { [x: string]: string },
    deletedProperties: string[],
    values: IndexedContextValues
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
        const contextData = translation.contexts.find(c => c.id?.toString() === context.id);
        if (!contextData) {
          translation.contexts.push({
            id: context.id,
            label: context.label,
            values: translatedValues,
            type: context.type,
          });

          return this.oldSave(translation);
        }

        contextData.values = contextData.values || [];
        contextData.values = contextData.values.filter(
          v => !deletedProperties.includes(v.key || '')
        );
        contextData.type = context.type;

        Object.keys(keyNamesChanges).forEach(originalKey => {
          const newKey = keyNamesChanges[originalKey];
          contextData.values = contextData.values || [];
          const value = contextData.values.find(v => v.key === originalKey);
          if (value) {
            value.key = newKey;

            if (translation.locale === defaultLanguage.key) {
              value.value = newKey;
            }
          }
          if (!value) {
            contextData.values.push({ key: newKey, value: values[newKey] });
          }
        });

        Object.keys(values).forEach(key => {
          contextData.values = contextData.values || [];
          if (!contextData.values.find(v => v.key === key)) {
            contextData.values.push({ key, value: values[key] });
          }
        });

        contextData.label = context.label;

        return this.oldSave(translation);
      })
    );
    await updateContextV2(context, keyNamesChanges, deletedProperties, values);
    return 'ok';
  },

  async addLanguage(newLanguage: LanguageISO6391) {
    const [languageTranslationAlreadyExists] = await model.get({ locale: newLanguage });
    if (languageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const defaultLanguage = await settings.getDefaultLanguage();
    const [defaultTranslation] = await model.get({ locale: defaultLanguage.key });

    const newLanguageTranslations = {
      ...defaultTranslation,
      _id: undefined,
      locale: newLanguage,
      contexts: (defaultTranslation.contexts || []).map(({ _id, ...context }) => context),
    };

    await addLanguageV2(newLanguage, defaultLanguage.key);
    return model.save(newLanguageTranslations);
  },

  async removeLanguage(locale: LanguageISO6391) {
    const result = await model.delete({ locale });
    await deleteTranslationsByLanguageV2(locale);
    return result;
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
