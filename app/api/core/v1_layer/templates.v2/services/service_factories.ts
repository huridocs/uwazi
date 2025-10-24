import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { DenormalizationService } from 'api/relationships.v2/services/service_factories';
import { DefaultTemplatesDataSource } from '../database/data_source_defaults';
import { CreateTemplateService as GenericCreateTemplateService } from './CreateTemplateService';

const CreateTemplateService = async () => {
  const transactionManager = DefaultTransactionManager();

  const templatesDataSource = DefaultTemplatesDataSource(transactionManager);
  const relTypesDataSource = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDataSource = DefaultEntitiesDataSource(transactionManager);
  const denormalizationService = await DenormalizationService(transactionManager);

  const service = new GenericCreateTemplateService(
    templatesDataSource,
    relTypesDataSource,
    entitiesDataSource,
    denormalizationService,
    transactionManager
  );

  return service;
};

export { CreateTemplateService };
