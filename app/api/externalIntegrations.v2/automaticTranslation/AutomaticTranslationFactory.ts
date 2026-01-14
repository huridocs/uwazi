import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { entityInputDataSchema } from '#api/entities.v2/types/EntityInputDataSchema.js';

import { EntityInputModel } from '#api/entities.v2/types/EntityInputDataType.js';

import { EventsBus } from '../eventsbus.js';

import { DefaultLogger } from '#api/log.v2/infrastructure/StandardLogger.js';

import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';

import { MongoTemplatesDataSource } from '#api/templates.v2/database/MongoTemplatesDataSource.js';
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
