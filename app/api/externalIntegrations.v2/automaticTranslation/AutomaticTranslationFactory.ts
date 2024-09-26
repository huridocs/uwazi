import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { AJVATConfigValidator } from './infrastructure/AJVATConfigValidator';
import { SaveEntityTranslations } from './SaveEntityTranslations';
import { AJVTranslationResultValidator } from './infrastructure/AJVTranslationResultValidator';

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
};

export { AutomaticTranslationFactory };
