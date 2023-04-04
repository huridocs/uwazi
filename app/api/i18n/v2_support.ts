import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTranslationsDataSource } from 'api/i18n.v2/database/MongoTranslationsDataSource';
import {
  CreateTranslationsData,
  CreateTranslationsService,
} from 'api/i18n.v2/services/CreateTranslationsService';
import { DeleteTranslationsService } from 'api/i18n.v2/services/DeleteTranslationsService';
import { UpsertTranslationsService } from 'api/i18n.v2/services/UpsertTranslationsService';
import { tenants } from 'api/tenants';
import { TranslationType } from 'shared/translationType';

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

export const createTranslationsV2 = async (translation: TranslationType) => {
  if (tenants.current().featureFlags?.translationsV2) {
    await new CreateTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient())
    ).create(flattenTranslations(translation));
  }
};

export const upsertTranslationsV2 = async (translation: TranslationType) => {
  if (tenants.current().featureFlags?.translationsV2) {
    await new UpsertTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
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

export const migrateTranslationsToV2 = async () => {
  const db = getConnection();
  if (!tenants.current().featureFlags?.translationsV2) {
    await db.collection('translations_v2').deleteMany({});
    return;
  }

  const alreadyMigrated = await db.collection('translations_v2_helper').findOne();
  if (alreadyMigrated?.migrated) {
    return;
  }

  const currentTranslationsCursor = db.collection('translations').find();
  // eslint-disable-next-line no-await-in-loop
  while (await currentTranslationsCursor.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    const translation = await currentTranslationsCursor.next();
    if (translation) {
      const flattenedTranslations = flattenTranslations(translation);
      if (flattenedTranslations.length) {
        // eslint-disable-next-line no-await-in-loop
        await db.collection('translations_v2').insertMany(flattenedTranslations);
      }
    }
  }

  await db.collection('translations_v2_helper').insertOne({ migrated: true });
};
