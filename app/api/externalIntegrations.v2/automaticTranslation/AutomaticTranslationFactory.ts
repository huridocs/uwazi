import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
import { entityInputDataSchema } from '../entities.v2/types/EntityInputDataSchema.js';
import { EntityInputModel } from '../entities.v2/types/EntityInputDataType.js';
import { EventsBus } from '../eventsbus.js';
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
import { TaskManager } from '../services/tasksmanager/TaskManager.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { DefaultTemplatesDataSource } from '../templates.v2/database/data_source_defaults.js';
import { MongoTemplatesDataSource } from '../templates.v2/database/MongoTemplatesDataSource.js';
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
      DefaultSettingsDataSource(transactionManager),
      DefaultTemplatesDataSource(transactionManager),
      new ATExternalAPI()
    );
  },

  defaultGenerateATConfig() {
    const transactionManager = DefaultTransactionManager();
    const db = getConnection();
    return new GenerateAutomaticTranslationsCofig(
      AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
      new MongoTemplatesDataSource(db, DefaultTransactionManager()),
      new Validator<SemanticConfig>(semanticConfigSchema)
    );
  },

  defaultSaveEntityTranslations() {
    const transactionManager = DefaultTransactionManager();
    return new SaveEntityTranslations(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new Validator<TranslationResult>(translationResultSchema),
      DefaultLogger()
    );
  },

  defaultRequestEntityTranslation() {
    const transactionManager = DefaultTransactionManager();
    return new RequestEntityTranslation(
      new TaskManager<ATTaskMessage>({
        serviceName: RequestEntityTranslation.SERVICE_NAME,
      }),
      AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new Validator<EntityInputModel>(entityInputDataSchema),
      DefaultLogger()
    );
  },

  defaultATEntityCreationListener(eventsBus: EventsBus) {
    return new ATEntityCreationListener(eventsBus);
  },
};

export { AutomaticTranslationFactory };
