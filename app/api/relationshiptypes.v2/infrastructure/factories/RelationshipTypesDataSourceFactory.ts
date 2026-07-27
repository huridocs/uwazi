import type { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DefaultRelationshipTypesDataSource } from '../../database/data_source_defaults.js';

class RelationshipTypesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    return DefaultRelationshipTypesDataSource(transactionManager);
  }
}

export { RelationshipTypesDataSourceFactory };
