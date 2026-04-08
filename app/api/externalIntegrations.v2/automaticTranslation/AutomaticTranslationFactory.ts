import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { entityInputDataSchema } from '#api/entities.v2/types/EntityInputDataSchema.js';
import { EntityInputModel } from '#api/entities.v2/types/EntityInputDataType.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { ATEntityCreationListener } from './adapters/driving/ATEntityCreationListener.js';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig.js';
import { ATExternalAPI } from './infrastructure/ATExternalAPI.js';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource.js';
import { Validator } from './infrastructure/Validator.js';
import { ATTaskMessage, RequestEntityTranslation } from './RequestEntityTranslation.js';
import { SaveEntityTranslations } from './SaveEntityTranslations.js';
import { SemanticConfig, semanticConfigSchema } from './types/SemanticConfig.js';
import { TranslationResult, translationResultSchema } from './types/TranslationResult.js';

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
    return new GenerateAutomaticTranslationsCofig(
      AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
      TemplatesDataSourceFactory.default(transactionManager),
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
