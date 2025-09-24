// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/database/d... Remove this comment to see the full error message
import { DefaultRelationshipDataSource } from '../relationships.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/data_... Remove this comment to see the full error message
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
import { DefaultEntitiesDataSource } from '../database/data_source_defaults';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from './EntityRelationshipsUpdateService';

export const EntityRelationshipsUpdateService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);

  return new GenericEntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS);
};
