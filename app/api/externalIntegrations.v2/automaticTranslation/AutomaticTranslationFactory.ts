import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/types/EntityInputDataSchema';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { EventsBus } from 'api/core/libs/eventsbus';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { MongoTemplatesDataSource } from 'api/core/infrastructure/mongodb/template/MongoTemplatesDataSource';
import { ATEntityCreationListener } from './adapters/driving/ATEntityCreationListener';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { ATExternalAPI } from './infrastructure/ATExternalAPI';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { Validator } from './infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from './RequestEntityTranslation';
import { SaveEntityTranslations } from './SaveEntityTranslations';
import { SemanticConfig, semanticConfigSchema } from './types/SemanticConfig';
import { TranslationResult, translationResultSchema } from './types/TranslationResult';

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
