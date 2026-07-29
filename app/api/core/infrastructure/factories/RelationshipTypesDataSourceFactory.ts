import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import type { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipTypesDataSource } from '#api/core/infrastructure/mongodb/relationshipType/MongoRelationshipTypesDataSource.js';

class RelationshipTypesDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    return new MongoRelationshipTypesDataSource(getConnection(), transactionManager);
  }
}

export { RelationshipTypesDataSourceFactory };
