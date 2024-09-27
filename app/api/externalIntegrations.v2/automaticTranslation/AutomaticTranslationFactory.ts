import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { AJVATConfigValidator } from './infrastructure/AJVATConfigValidator';
import { AJVTranslationResultValidator } from './infrastructure/AJVTranslationResultValidator';
import { ATExternalAPI } from './infrastructure/ATExternalAPI';
import { AJVEntityInputValidator } from './infrastructure/EntityInputValidator';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { ATTaskMessage, RequestEntityTranslation } from './RequestEntityTranslation';
import { SaveEntityTranslations } from './SaveEntityTranslations';
import { ATConfigService } from './services/GetAutomaticTranslationConfig';

const AutomaticTranslationFactory = {
  defaultGenerateATConfig() {
    return new GenerateAutomaticTranslationsCofig(
      new MongoATConfigDataSource(getConnection(), DefaultTransactionManager()),
      new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager()),
      new AJVATConfigValidator()
    );
  },

  defaultSaveEntityTranslations() {
    const transactionManager = DefaultTransactionManager();
    return new SaveEntityTranslations(
      DefaultTemplatesDataSource(transactionManager),
      DefaultEntitiesDataSource(transactionManager),
      new AJVTranslationResultValidator()
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
      new AJVEntityInputValidator()
    );
  },
};

export { AutomaticTranslationFactory };
