import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.js';
import { EventsBus } from '#api/core/libs/eventsbus/EventsBus.js';



import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { entityInputDataSchema } from '#api/entities.v2/types/EntityInputDataSchema.js';

import { EntityInputModel } from '#api/entities.v2/types/EntityInputDataType.js';



import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';

import { ATEntityCreationListener } from '#api/externalIntegrations.v2/automaticTranslation/adapters/driving/ATEntityCreationListener.js';
import { GenerateAutomaticTranslationsCofig } from '#api/externalIntegrations.v2/automaticTranslation/GenerateAutomaticTranslationConfig.js';
import { ATExternalAPI } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/ATExternalAPI.js';
import { MongoATConfigDataSource } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/MongoATConfigDataSource.js';
import { Validator } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/Validator.js';
import { ATTaskMessage, RequestEntityTranslation } from '#api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation.js';
import { SaveEntityTranslations } from '#api/externalIntegrations.v2/automaticTranslation/SaveEntityTranslations.js';
import { SemanticConfig, semanticConfigSchema } from '#api/externalIntegrations.v2/automaticTranslation/types/SemanticConfig.js';
import { TranslationResult, translationResultSchema } from '#api/externalIntegrations.v2/automaticTranslation/types/TranslationResult.js';

const AutomaticTranslationFactory = {
  defaultATConfigDataSource(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoATConfigDataSource(
      db,
      transactionManager,
      SettingsDataSourceFactory.default(transactionManager),
      TemplatesDataSourceFactory.default(transactionManager),
      new ATExternalAPI()
    );
  },

  defaultGenerateATConfig() {
    const transactionManager = TransactionManagerFactory.default();
    const db = getConnection();
    return new GenerateAutomaticTranslationsCofig(
      AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
      new MongoTemplatesDataSource(db, TransactionManagerFactory.default()),
      new Validator<SemanticConfig>(semanticConfigSchema)
    );
  },

  defaultSaveEntityTranslations() {
    const transactionManager = TransactionManagerFactory.default();
    return new SaveEntityTranslations(
      TemplatesDataSourceFactory.default(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new Validator<TranslationResult>(translationResultSchema),
      LoggerFactory.default()
    );
  },

  defaultRequestEntityTranslation() {
    const transactionManager = TransactionManagerFactory.default();
    return new RequestEntityTranslation(
      new TaskManager<ATTaskMessage>({
        serviceName: RequestEntityTranslation.SERVICE_NAME,
      }),
      AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new Validator<EntityInputModel>(entityInputDataSchema),
      LoggerFactory.default()
    );
  },

  defaultATEntityCreationListener(eventsBus: EventsBus) {
    return new ATEntityCreationListener(eventsBus);
  },
};

export { AutomaticTranslationFactory };
