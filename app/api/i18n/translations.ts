/* eslint-disable max-lines */
import * as os from 'os';
import path from 'path';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import { ObjectId } from 'mongodb';
import { pipeline } from 'stream/promises';
import { CSVLoader } from '#api/csv/index.js';
import { generateFileName } from '#api/files/index.js';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { PropagateThesaurusTranslationServiceFactory } from '#api/core/infrastructure/factories/PropagateThesaurusTranslationServiceFactory.js';
import { SaveTranslationEntriesServiceFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesServiceFactory.js';
import { DefaultTranslations } from '#api/i18n/defaultTranslations.js';
import { legacyLogger } from '#api/log/index.js';
import { EnforcedWithId, WithId } from '#api/odm/index.js';
import settings from '#api/settings/settings.js';
import { prettifyError } from '#api/utils/handleError.js';
import { TranslationContext, TranslationType, TranslationValue } from '#shared/translationType.js';

import { availableLanguages } from '#shared/language/index.js';
import { ContextType } from '#shared/translationSchema.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationContext as DomainTranslationContext } from '#api/core/domain/translation/Translation.js';
import { TranslationSyO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationSyO.js';
import {
  addLanguageV2,
  deleteTranslationsByContextIdV2,
  deleteTranslationsByLanguageV2,
  getTranslationsV2,
  getTranslationsV2ByContext,
  getTranslationsV2ByLanguage,
  updateContextV2,
  upsertTranslationsV2,
} from './v2_support.js';

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

function indexedValuesToList(indexedValues: IndexedContextValues): TranslationValue[] {
  return Object.keys(indexedValues)
    .filter(key => indexedValues[key])
    .map(key => ({ key, value: indexedValues[key] }));
}

function processContextValues(context: TranslationContext | IndexedContext): TranslationContext {
  let values: TranslationValue[] = [];

  if (context.values && !Array.isArray(context.values)) {
    values = indexedValuesToList(context.values);
  } else if (Array.isArray(context.values)) {
    values = context.values as TranslationValue[];
  }

  checkDuplicateKeys(context, values);

  return { ...context, values };
}

const propagateTranslation = async (
  translation: TranslationType,
  currentTranslationData: WithId<TranslationType>
) => {
  await PropagateThesaurusTranslationServiceFactory.default().forLocale(
    translation,
    currentTranslationData.contexts || []
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

export default {
  prepareContexts,

  async get(query: { locale?: LanguageISO6391; context?: string } = {}) {
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

    if (!translation.locale) {
      throw new Error('translation to save should have a locale');
    }

    const [currentTranslationData] = await getTranslationsV2ByLanguage(translation.locale);

    const processedTranslation: TranslationType & { contexts: TranslationContext[] } = {
      ...translation,
      contexts: (translation.contexts || []).map(processContextValues),
    };

    await propagateTranslation(processedTranslation, currentTranslationData);

    await upsertTranslationsV2([translationToSave]);
    return translationToSave;
  },

  async v2StructureSave(translationsToSave: TranslationSyO[]) {
    await SaveTranslationEntriesServiceFactory.default().execute(translationsToSave);
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
    id: string | ObjectId,
    contextName: string,
    values: IndexedContextValues,
    type: ContextType
  ) {
    await CreateTranslationContextUseCaseFactory.default().execute({
      context: {
        id: id.toString(),
        label: contextName,
        type: type as 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus',
      },
      values,
    });

    return 'ok';
  },

  async deleteContext(contextId: string) {
    await deleteTranslationsByContextIdV2(contextId);
    return 'ok';
  },

  async updateContext(
    context: { id: string; label: string; type: ContextType | string },
    keyNamesChanges: { [x: string]: string },
    deletedProperties: string[],
    values: IndexedContextValues
  ) {
    const domainContext: DomainTranslationContext = {
      id: context.id,
      label: context.label,
      type: context.type as DomainTranslationContext['type'],
    };
    await updateContextV2(domainContext, keyNamesChanges, deletedProperties, values);
    return 'ok';
  },

  async addLanguage(newLanguage: LanguageISO6391) {
    const [translations] = await getTranslationsV2ByLanguage(newLanguage);
    if (translations.contexts?.length) {
      return Promise.resolve();
    }

    const defaultLanguage = await settings.getDefaultLanguage();

    return addLanguageV2(newLanguage, defaultLanguage.key);
  },

  async removeLanguage(locale: LanguageISO6391) {
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
      legacyLogger.error(prettifyError(e));
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
