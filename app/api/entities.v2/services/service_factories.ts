import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { MongoTemplatesDataSourceFactory } from 'api/core/infrastructure/factories/MongoTemplatesDataSourceFactory';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultEntitiesDataSource } from '../database/data_source_defaults';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from './EntityRelationshipsUpdateService';

export const EntityRelationshipsUpdateService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = MongoTemplatesDataSourceFactory.default(transactionManager);

  return new GenericEntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS);
};
