import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/types/EntityInputDataSchema';
import { EntityInputModel } from 'api/entities.v2/types/EntityInputDataType';
import { EventsBus } from 'api/eventsbus';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { ATEntityCreationListener } from './adapters/driving/ATEntityCreationListener';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { ATExternalAPI } from './infrastructure/ATExternalAPI';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { Validator } from './infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from './RequestEntityTranslation';
import { SaveEntityTranslationPending } from './SaveEntityTranslationsPending';
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

  defaultSaveEntityTranslationPending() {
    const transactionManager = DefaultTransactionManager();
    return new SaveEntityTranslationPending(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      DefaultLogger()
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
      AutomaticTranslationFactory.defaultATConfigDataSource(DefaultTransactionManager()),
      new SaveEntityTranslationPending(
        DefaultTemplatesDataSource(transactionManager),
        DefaultEntitiesDataSource(transactionManager),
        DefaultLogger()
      ),
      new Validator<EntityInputModel>(entityInputDataSchema),
      DefaultLogger()
    );
  },

  defaultATEntityCreationListener(eventsBus: EventsBus) {
    return new ATEntityCreationListener(eventsBus);
  },
};

export { AutomaticTranslationFactory };
