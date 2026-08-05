import { DefaultRelationshipDataSource } from '#api/relationships.v2/database/data_source_defaults.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DefaultDeprecatedEntitiesDataSource } from '../database/data_source_defaults.js';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from './EntityRelationshipsUpdateService.js';

export const EntityRelationshipsUpdateService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultDeprecatedEntitiesDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });

  return new GenericEntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS);
};
