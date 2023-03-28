import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTranslationsDataSource } from 'api/i18n.v2/database/MongoTranslationsDataSource';
import {
  CreateTranslationsData,
  CreateTranslationsService,
} from 'api/i18n.v2/services/CreateTranslationsService';
import { tenants } from 'api/tenants';
import { TranslationType } from 'shared/translationType';

export const createTranslationsV2 = async (translation: TranslationType) => {
  if (translation.contexts?.length && tenants.current().featureFlags?.translationsV2) {
    await new CreateTranslationsService(
      new MongoTranslationsDataSource(getConnection(), new MongoTransactionManager(getClient())),
      new MongoTransactionManager(getClient()),
      MongoIdHandler
    ).create(
      translation.contexts.reduce(
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
      )
    );
  }
};

export const upsertTranslationsV2 = async (translation: TranslationType) => {
  if (translation.contexts?.length && tenants.current().featureFlags?.translationsV2) {

  }
};
