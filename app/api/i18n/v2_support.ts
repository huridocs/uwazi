import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTranslationsSyncDataSource } from '#api/core/infrastructure/mongodb/translation/MongoTranslationsSyncDataSource.js';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { CreateTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationEntriesUseCaseFactory.js';
import { DeleteTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/DeleteTranslationContextUseCaseFactory.js';
import { DeleteTranslationsByLanguageUseCaseFactory } from '#api/core/infrastructure/factories/DeleteTranslationsByLanguageUseCaseFactory.js';
import { UpdateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTranslationContextUseCaseFactory.js';
import { UpdateTranslationEntriesUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTranslationEntriesUseCaseFactory.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { EnforcedWithId, models } from '#api/odm/index.js';
import { TranslationType } from '#shared/translationType.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { IndexedContextValues } from './translations.js';

models.translationsV2 = () =>
  new MongoTranslationsSyncDataSource(getConnection(), TransactionManagerFactory.default());

const flattenTranslations = (translation: TranslationType): TranslationEntryInput[] => {
  if (translation.contexts?.length) {
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
  return [];
};

export const resultsToV1TranslationType = async (
  tranlationsResult: ResultSet<Translation>,
  onlyLanguage?: LanguageISO6391
) => {
  const query = TranslationsQueryServiceFactory.default();
  return query.toMammothDto(tranlationsResult, onlyLanguage);
};

export const createTranslationsV2 = async (translation: TranslationType) => {
  await CreateTranslationEntriesUseCaseFactory.default().execute({
    translations: flattenTranslations(translation),
  });
};

/**
 * Compatibility bridge for callers that previously "upserted" entries.
 * Branches into create vs update use cases by whether keys already exist.
 */
export const upsertTranslationEntries = async (translations: TranslationEntryInput[]) => {
  if (!translations.length) {
    return;
  }

  const translationsDS = TranslationsDataSourceFactory.default({
    transactionManager: TransactionManagerFactory.default(),
  });

  const byContext = new Map<string, TranslationEntryInput[]>();
  translations.forEach(t => {
    const list = byContext.get(t.context.id) || [];
    list.push(t);
    byContext.set(t.context.id, list);
  });

  const toCreate: TranslationEntryInput[] = [];
  const toUpdate: TranslationEntryInput[] = [];

  await Promise.all(
    [...byContext.entries()].map(async ([contextId, entries]) => {
      const keys = Array.from(new Set(entries.map(e => e.key)));
      const missingKeys = new Set(
        await translationsDS.calculateNonexistentKeys(contextId, keys)
      );
      entries.forEach(entry => {
        if (missingKeys.has(entry.key)) {
          toCreate.push(entry);
        } else {
          toUpdate.push(entry);
        }
      });
    })
  );

  if (toCreate.length) {
    await CreateTranslationEntriesUseCaseFactory.default().execute({ translations: toCreate });
  }
  if (toUpdate.length) {
    await UpdateTranslationEntriesUseCaseFactory.default().execute({ translations: toUpdate });
  }
};

export const upsertTranslationsV2 = async (translations: TranslationType[]) => {
  const translationsToUpsert = translations.reduce<TranslationEntryInput[]>(
    (flattened, t) => flattened.concat(flattenTranslations(t)),
    []
  );
  return upsertTranslationEntries(translationsToUpsert);
};

export const deleteTranslationsByContextIdV2 = async (contextId: string) => {
  await DeleteTranslationContextUseCaseFactory.default().execute({ contextId });
};

export const deleteTranslationsByLanguageV2 = async (language: LanguageISO6391) => {
  await DeleteTranslationsByLanguageUseCaseFactory.default().execute({ language });
};

export const getTranslationsV2ByContext = async (context: string) =>
  TranslationsQueryServiceFactory.default().getMammoth({ context });

export const getTranslationsV2ByLanguage = async (language: LanguageISO6391) =>
  TranslationsQueryServiceFactory.default().getMammoth({ locale: language });

export const getTranslationsEntriesV2 = async () =>
  TranslationsQueryServiceFactory.default().getAll();

export const getTranslationsV2 = async () => TranslationsQueryServiceFactory.default().getMammoth();

export const updateContextV2 = async (
  context: TranslationEntryInput['context'],
  keyNamesChanges: { [x: string]: string },
  keysToDelete: string[],
  valueChanges: IndexedContextValues
) => {
  await UpdateTranslationContextUseCaseFactory.default().execute({
    context,
    keyChanges: keyNamesChanges,
    keysToDelete,
    valueChanges,
  });
};

export const addLanguageV2 = async (
  newLanguage: LanguageISO6391,
  defaultLanguage: LanguageISO6391
) => {
  const translationsDS = TranslationsDataSourceFactory.default({
    transactionManager: TransactionManagerFactory.default(),
  });
  await translationsDS.cloneForLanguage(defaultLanguage, newLanguage);
  const [result] = (await getTranslationsV2ByLanguage(newLanguage)) || [];
  return result as EnforcedWithId<TranslationType>;
};

/** @deprecated Prefer CreateTranslationContextUseCaseFactory */
export const createTranslationContextV2 = async (
  context: TranslationEntryInput['context'],
  values: IndexedContextValues
) => {
  await CreateTranslationContextUseCaseFactory.default().execute({ context, values });
};
