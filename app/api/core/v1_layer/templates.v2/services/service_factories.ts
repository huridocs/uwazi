import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';

import { DenormalizationService } from '#api/relationships.v2/services/service_factories.js';
import { DefaultTemplatesDataSource } from '../database/data_source_defaults';
import { CreateTemplateService as GenericCreateTemplateService } from '#api/core/v1_layer/templates.v2/services/CreateTemplateService.js';

const CreateTemplateService = async () => {
  const transactionManager = TransactionManagerFactory.default();

  const templatesDataSource = TemplatesDataSourceFactory.default(transactionManager);
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
