import { ObjectId } from 'mongodb';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { SaveLocaleTranslationsUseCaseFactory } from '#api/core/infrastructure/factories/SaveLocaleTranslationsUseCaseFactory.js';
import { SaveTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/SaveTranslationEntriesUseCaseFactory.js';
import { UpdateEntriesByContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntriesByContextUseCaseFactory.js';
import { AvailableLanguagesQueryServiceFactory } from '#api/core/infrastructure/factories/AvailableLanguagesQueryServiceFactory.js';
import { importPredefinedTranslations } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import {
  IndexedContextValues,
  IndexedTranslations,
  prepareContexts,
  toIndexedTranslations,
} from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import settings from '#api/settings/settings.js';
import { TranslationType } from '#shared/translationType.js';

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
} from './v2_support.js';

/**
 * Thin test / legacy convenience façade over core translation factories.
 * Production HTTP routes must not depend on this module.
 */
export default {
  prepareContexts,

  async get(query: { locale?: LanguageISO6391; context?: string } = {}) {
    const language = query.locale;

    if (query.context) {
      return toIndexedTranslations(await getTranslationsV2ByContext(query.context));
    }

    if (language) {
      return toIndexedTranslations(await getTranslationsV2ByLanguage(language));
    }

    return toIndexedTranslations(await getTranslationsV2());
  },

  async save(translation: TranslationType | IndexedTranslations) {
    return SaveLocaleTranslationsUseCaseFactory.default().execute(translation);
  },

  async v2StructureSave(translationsToSave: TranslationSyO[]) {
    await SaveTranslationEntriesUseCaseFactory.default().execute({
      translations: translationsToSave,
    });
  },

  async updateEntries(
    contextId: string,
    keyValuePairsPerLanguage: {
      [x: string]: { [k: string]: string };
    }
  ) {
    return UpdateEntriesByContextUseCaseFactory.default().execute({
      contextId,
      keyValuePairsPerLanguage,
    });
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
    return importPredefinedTranslations(locale);
  },

  async availableLanguages() {
    return AvailableLanguagesQueryServiceFactory.default().execute();
  },
};

export type {
  IndexedContextValues,
  IndexedContext,
  IndexedTranslations,
} from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
