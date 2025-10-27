import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { DefaultEntitiesDataSource } from '../database/data_source_defaults';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from './EntityRelationshipsUpdateService';

export const EntityRelationshipsUpdateService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

  return new GenericEntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS);
};
