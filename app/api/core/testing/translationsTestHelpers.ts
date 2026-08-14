import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TranslationContext } from '#api/core/domain/translation/Translation.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

const withTranslationsService = async <T>(
  fn: (service: TranslationsService) => Promise<T>
): Promise<T> =>
  testingEnvironment.runWithContext(async () => {
    const transactionManager = TransactionManagerFactory.default();
    const translationsService = TranslationsServiceFactory.default({ transactionManager });
    return transactionManager.run(async () => fn(translationsService));
  });

export const insertTranslationEntries = async (translations: TranslationEntryInput[]) =>
  withTranslationsService(async service => service.insertEntries(translations));

export const createTranslationContext = async (
  context: TranslationContext,
  values: Record<string, string>
) => withTranslationsService(async service => service.createContext(context, values));

export const updateTranslationContext = async (input: {
  context: TranslationContext;
  keyChanges: Record<string, string>;
  keysToDelete: string[];
  valueChanges: Record<string, string>;
}) => withTranslationsService(async service => service.updateContext(input));

export const deleteTranslationContext = async (contextId: string) =>
  withTranslationsService(async service => service.deleteByContextId(contextId));

export const deleteTranslationsByLanguage = async (language: LanguageISO6391) =>
  withTranslationsService(async service => service.deleteByLanguage(language));
