import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { entityInputDataSchema } from 'api/entities.v2/EntityInputDataSchema';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import { EventsBus } from 'api/eventsbus';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { ATEntityCreationListener } from './adapters/driving/ATEntityCreationListener';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { ATExternalAPI } from './infrastructure/ATExternalAPI';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { Validator } from './infrastructure/Validator';
import { ATTaskMessage, RequestEntityTranslation } from './RequestEntityTranslation';
import { SaveEntityTranslations } from './SaveEntityTranslations';
import { ATConfigService } from './services/GetAutomaticTranslationConfig';
import { SemanticConfig, semanticConfigSchema } from './types/SemanticConfig';
import { TranslationResult, translationResultSchema } from './types/TranslationResult';

const AutomaticTranslationFactory = {
  defaultGenerateATConfig() {
    return new GenerateAutomaticTranslationsCofig(
      new MongoATConfigDataSource(getConnection(), DefaultTransactionManager()),
      new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager()),
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

  defaultATConfigService() {
    const transactionManager = DefaultTransactionManager();
    return new ATConfigService(
      DefaultSettingsDataSource(transactionManager),
      new MongoATConfigDataSource(getConnection(), transactionManager),
      DefaultTemplatesDataSource(transactionManager),
      new ATExternalAPI()
    );
  },

  defaultRequestEntityTranslation() {
    return new RequestEntityTranslation(
      new TaskManager<ATTaskMessage>({
        serviceName: RequestEntityTranslation.SERVICE_NAME,
      }),
      DefaultTemplatesDataSource(DefaultTransactionManager()),
      AutomaticTranslationFactory.defaultATConfigService(),
      new Validator<EntityInputData>(entityInputDataSchema),
      DefaultLogger()
    );
  },

  defaultATEntityCreationListener(eventsBus: EventsBus) {
    return new ATEntityCreationListener(eventsBus);
  },
};

export { AutomaticTranslationFactory };
