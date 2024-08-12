import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { GenerateAutomaticTranslationsCofig } from './GenerateAutomaticTranslationConfig';
import { MongoATConfigDataSource } from './infrastructure/MongoATConfigDataSource';
import { AJVATConfigValidator } from './infrastructure/AJVATConfigValidator';

const AutomaticTranslationFactory = {
  defaultGenerateATConfig() {
    return new GenerateAutomaticTranslationsCofig(
      new MongoATConfigDataSource(getConnection(), DefaultTransactionManager()),
      new MongoTemplatesDataSource(getConnection(), DefaultTransactionManager()),
      new AJVATConfigValidator()
    );
  },
};

export { AutomaticTranslationFactory };
