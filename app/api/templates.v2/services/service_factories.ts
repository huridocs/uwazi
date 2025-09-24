
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/data_s... Remove this comment to see the full error message
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../relationshiptypes.v2/databa... Remove this comment to see the full error message
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/services/s... Remove this comment to see the full error message
import { DenormalizationService } from '../relationships.v2/services/service_factories.js';
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
