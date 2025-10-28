import { ResultSet } from 'api/core/application/contracts/ResultSet';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTranslationsSyncDataSource } from 'api/i18n.v2/database/MongoTranslationsSyncDataSource';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { Translation } from 'api/i18n.v2/model/Translation';
import {
  CreateTranslationsData,
  CreateTranslationsService,
} from 'api/i18n.v2/services/CreateTranslationsService';
import { DeleteTranslationsService } from 'api/i18n.v2/services/DeleteTranslationsService';
import { GetTranslationsService } from 'api/i18n.v2/services/GetTranslationsService';
import { UpsertTranslationsService } from 'api/i18n.v2/services/UpsertTranslationsService';
import { ValidateTranslationsService } from 'api/i18n.v2/services/ValidateTranslationsService';
import { EnforcedWithId, models } from 'api/odm';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { IndexedContextValues } from './translations';

models.translationsV2 = () =>
  new MongoTranslationsSyncDataSource(getConnection(), TransactionManagerFactory.default());

const flattenTranslations = (translation: TranslationType): CreateTranslationsData[] => {
  if (translation.contexts?.length) {
    return translation.contexts.reduce<CreateTranslationsData[]>((flatTranslations, context) => {
      if (context.values) {
        context.values.forEach(contextValue => {
          flatTranslations.push({
            language: translation.locale,
            key: contextValue.key,
            value: contextValue.value,
            context: { type: context.type, label: context.label, id: context.id },
          } as CreateTranslationsData);
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
  const transactionManager = TransactionManagerFactory.default();
  const settings = SettingsDataSourceFactory.default(transactionManager);
  let languageKeys = await settings.getLanguageKeys();
  if (onlyLanguage) {
    languageKeys = [onlyLanguage];
  }

  // const resultMap: { [language: string]: TranslationType & { locale: string } } = {};

  const resultMap = languageKeys.reduce<{
    [language: string]: TranslationType & { locale: string };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = { locale: key, contexts: [] };
    return memo;
  }, {});

  const contexts = languageKeys.reduce<{
    [language: string]: { [context: string]: TranslationContext & { values: TranslationValue[] } };
  }>((memo, key) => {
    // eslint-disable-next-line no-param-reassign
    memo[key] = {};
    return memo;
  }, {});

  await tranlationsResult.forEach(translation => {
    if (!resultMap[translation.language]) {
      resultMap[translation.language] = {
        locale: translation.language,
        contexts: [],
      };
      contexts[translation.language] = {};
    }
    if (!contexts[translation.language][translation.context.id]) {
      contexts[translation.language][translation.context.id] = {
        id: translation.context.id,
        label: translation.context.label,
        type: translation.context.type,
        values: [],
      };
    }
    contexts[translation.language][translation.context.id].values.push({
      key: translation.key,
      value: translation.value,
    });
  });

  return Object.values(resultMap).map(translation => {
    // eslint-disable-next-line no-param-reassign
    translation.contexts = Object.values(contexts[translation.locale]);
    return translation;
  }) as EnforcedWithId<TranslationType>[];
};

export const createTranslationsV2 = async (translation: TranslationType) => {
  const transactionManager = TransactionManagerFactory.default();
  await new CreateTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      SettingsDataSourceFactory.default(transactionManager)
    ),
    transactionManager
  ).create(flattenTranslations(translation));
};

export const upsertTranslationEntries = async (translations: CreateTranslationsData[]) => {
  const transactionManager = TransactionManagerFactory.default();
  await new UpsertTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    SettingsDataSourceFactory.default(transactionManager),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      SettingsDataSourceFactory.default(transactionManager)
    ),
    transactionManager
  ).upsert(translations);
};

export const upsertTranslationsV2 = async (translations: TranslationType[]) => {
  const translationsToUpsert = translations.reduce<CreateTranslationsData[]>(
    (flattened, t) => flattened.concat(flattenTranslations(t)),
    []
  );
  return upsertTranslationEntries(translationsToUpsert);
};

export const deleteTranslationsByContextIdV2 = async (contextId: string) => {
  const transactionManager = TransactionManagerFactory.default();
  await new DeleteTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    transactionManager
  ).deleteByContextId(contextId);
};

export const deleteTranslationsByLanguageV2 = async (language: LanguageISO6391) => {
  const transactionManager = TransactionManagerFactory.default();
  return new DeleteTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    transactionManager
  ).deleteByLanguage(language);
};

export const getTranslationsV2ByContext = async (context: string) =>
  resultsToV1TranslationType(
    new GetTranslationsService(
      DefaultTranslationsDataSource(TransactionManagerFactory.default())
    ).getByContext(context)
  );

export const getTranslationsV2ByLanguage = async (language: LanguageISO6391) =>
  resultsToV1TranslationType(
    new GetTranslationsService(
      DefaultTranslationsDataSource(TransactionManagerFactory.default())
    ).getByLanguage(language),
    language
  );

export const getTranslationsEntriesV2 = async () =>
  new GetTranslationsService(
    DefaultTranslationsDataSource(TransactionManagerFactory.default())
  ).getAll();

export const getTranslationsV2 = async () =>
  resultsToV1TranslationType(await getTranslationsEntriesV2());

export const updateContextV2 = async (
  context: CreateTranslationsData['context'],
  keyNamesChanges: { [x: string]: string },
  keysToDelete: string[],
  valueChanges: IndexedContextValues
) => {
  const transactionManager = TransactionManagerFactory.default();
  await new UpsertTranslationsService(
    DefaultTranslationsDataSource(transactionManager),
    SettingsDataSourceFactory.default(transactionManager),
    new ValidateTranslationsService(
      DefaultTranslationsDataSource(transactionManager),
      SettingsDataSourceFactory.default(transactionManager)
    ),
    transactionManager
  ).updateContext(context, keyNamesChanges, valueChanges, keysToDelete);
};

export const addLanguageV2 = async (
  newLanguage: LanguageISO6391,
  defaultLanguage: LanguageISO6391
) => {
  const [defaultTranslation] = (await getTranslationsV2ByLanguage(defaultLanguage)) || [];
  const newLanguageTranslations = {
    ...defaultTranslation,
    locale: newLanguage,
    contexts: (defaultTranslation.contexts || []).map(({ _id, ...context }) => context),
  };

  await createTranslationsV2(newLanguageTranslations);
  const [result] = (await getTranslationsV2ByLanguage(newLanguage)) || [];
  return result;
};
