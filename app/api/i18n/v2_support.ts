import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTranslationsDataSource } from 'api/i18n.v2/database/MongoTranslationsDataSource';
import { Translation } from 'api/i18n.v2/model/Translation';
import {
  CreateTranslationsData,
  CreateTranslationsService,
} from 'api/i18n.v2/services/CreateTranslationsService';
import { DeleteTranslationsService } from 'api/i18n.v2/services/DeleteTranslationsService';
import { GetTranslationsService } from 'api/i18n.v2/services/GetTranslationsService';
import { UpsertTranslationsService } from 'api/i18n.v2/services/UpsertTranslationsService';
import { EnforcedWithId } from 'api/odm';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { tenants } from 'api/tenants';
import { TranslationContext, TranslationType, TranslationValue } from 'shared/translationType';
import migration from 'api/i18n.v2/migrations/';
import { Db } from 'mongodb';

const cleanUpV2Collections = async (db: Db) => {
  try {
    await db.collection('translations_v2').drop({});
    await db.collection('translations_v2_helper').drop();
  } catch (e) {
    if (e.message !== 'ns not found') {
      throw e;
    }
  }
};

const flattenTranslations = (translation: TranslationType): CreateTranslationsData[] => {
  if (translation.contexts?.length) {
    return translation.contexts.reduce(
      (flatTranslations, context) =>
        flatTranslations.concat(
          context.values
            ? context.values.map(
                contextValue =>
                  ({
                    language: translation.locale,
                    key: contextValue.key,
                    value: contextValue.value,
                    context: { type: context.type, label: context.label, id: context.id },
                  } as CreateTranslationsData)
              )
            : []
        ),
      [] as CreateTranslationsData[]
    );
  }
  return [];
};

const resultsToV1TranslationType = async (tranlationsResult: ResultSet<Translation>) => {
  const resultMap: { [language: string]: TranslationType & { locale: string } } = {};
  const contexts: {
    [language: string]: { [context: string]: TranslationContext & { values: TranslationValue[] } };
  } = {};
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
  if (tenants.current().featureFlags?.translationsV2) {
    await new CreateTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient())
    ).create(flattenTranslations(translation));
  }
};

export const upsertTranslationsV2 = async (translation: TranslationType) => {
  if (tenants.current().featureFlags?.translationsV2) {
    await new UpsertTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoSettingsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient())
    ).upsert(flattenTranslations(translation));
  }
};

export const deleteTranslationsByContextIdV2 = async (contextId: string) => {
  await new DeleteTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient())
  ).deleteByContextId(contextId);
};

export const deleteTranslationsByLanguageV2 = async (language: string) => {
  await new DeleteTranslationsService(
    new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
    new MongoTransactionManager(getClient())
  ).deleteByLanguage(language);
};

export const getTranslationsV2ByContext = async (context: string) =>
  resultsToV1TranslationType(
    new GetTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient()))
    ).getByContext(context)
  );

export const getTranslationsV2ByLanguage = async (language: string) =>
  resultsToV1TranslationType(
    new GetTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient()))
    ).getByLanguage(language)
  );

export const getTranslationsV2 = async () =>
  resultsToV1TranslationType(
    new GetTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient()))
    ).getAll()
  );

export const migrateTranslationsToV2 = async () => {
  const db = getConnection();
  if (!tenants.current().featureFlags?.translationsV2) {
    await cleanUpV2Collections(db);
    return false;
  }

  const needsMigration = await db
    .collection('translations_v2_helper')
    .findOneAndUpdate({ migration_helper: true }, { $set: { migrating: true } }, { upsert: true });

  if (needsMigration.value?.migrated) {
    return true;
  }

  if (needsMigration.value?.migrating) {
    return false;
  }

  await migration.up(db);

  await db
    .collection('translations_v2_helper')
    .findOneAndUpdate({ migration_helper: true }, { $set: { migrated: true, migrating: false } });

  return false;
};
