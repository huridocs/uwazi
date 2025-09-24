
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/data_s... Remove this comment to see the full error message
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/types/EntityInp... Remove this comment to see the full error message
import { entityInputDataSchema } from '../entities.v2/types/EntityInputDataSchema.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/types/EntityInp... Remove this comment to see the full error message
import { EntityInputModel } from '../entities.v2/types/EntityInputDataType.js';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../services/tasksmanager/TaskM... Remove this comment to see the full error message
import { TaskManager } from '../services/tasksmanager/TaskManager.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/data_... Remove this comment to see the full error message
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/Mongo... Remove this comment to see the full error message
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource.js';
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
