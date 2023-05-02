import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from '../database/data_source_defaults';
import { CreateTemplateService as GenericCreateTemplateService } from './CreateTemplateService';

const CreateTemplateService = () => {
  const transactionManager = DefaultTransactionManager();

  const templatesDataSource = DefaultTemplatesDataSource(transactionManager);
  const relTypesDataSource = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDataSource = DefaultEntitiesDataSource(transactionManager);

  const service = new GenericCreateTemplateService(
    templatesDataSource,
    relTypesDataSource,
    entitiesDataSource
  );

  return service;
};

export { CreateTemplateService };
