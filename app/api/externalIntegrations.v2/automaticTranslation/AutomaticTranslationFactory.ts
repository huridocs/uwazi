import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
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
  /**
   * AT config lives only in Mongo. Settings and templates take the Postgres manager from the
   * context on postgresCore tenants, so the Mongo manager given here only reaches their Mongo side.
   */
  defaultATConfigDataSource(
    transactionManager: TransactionManager = ExecutionContext.mongoTransactionManager
  ) {
    return new MongoATConfigDataSource(
      getConnection(),
      transactionManager,
      SettingsDataSourceFactory.default({ transactionManager }),
      TemplatesDataSourceFactory.default({ transactionManager }),
      new ATExternalAPI()
    );
  },

  defaultGenerateATConfig() {
    return new GenerateAutomaticTranslationsCofig(
      AutomaticTranslationFactory.defaultATConfigDataSource(),
      TemplatesDataSourceFactory.default(),
      new Validator<SemanticConfig>(semanticConfigSchema)
    );
  },

  defaultSaveEntityTranslations() {
    return new SaveEntityTranslations(
      TemplatesDataSourceFactory.default(),
      EntitiesDataSourceFactory.default(),
      ExecutionContext.transactionManager,
      new Validator<TranslationResult>(translationResultSchema),
      LoggerFactory.default()
    );
  },

  defaultRequestEntityTranslation() {
    return new RequestEntityTranslation(
      new TaskManager<ATTaskMessage>({
        serviceName: RequestEntityTranslation.SERVICE_NAME,
      }),
      AutomaticTranslationFactory.defaultATConfigDataSource(),
      EntitiesDataSourceFactory.default(),
      ExecutionContext.transactionManager,
      new Validator<EntityInputModel>(entityInputDataSchema),
      LoggerFactory.default()
    );
  },

  defaultATEntityCreationListener(eventsBus: EventsBus) {
    return new ATEntityCreationListener(eventsBus);
  },
};

export { AutomaticTranslationFactory };
