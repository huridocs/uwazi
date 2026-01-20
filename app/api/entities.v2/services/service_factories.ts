import { DefaultRelationshipDataSource } from '#api/relationships.v2/database/data_source_defaults.js';

import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from '#api/entities.v2/services/EntityRelationshipsUpdateService.js';

export const EntityRelationshipsUpdateService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

  return new GenericEntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS);
};
