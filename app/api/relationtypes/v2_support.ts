import { ObjectId } from 'mongodb';

import { GetRelationshipsService } from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';

const getNewRelationshipCount = async (id: ObjectId) => {
  const transactionManager = new MongoTransactionManager(getClient());
  const newRelationshipsAllowed = await DefaultSettingsDataSource(
    transactionManager
  ).readNewRelationshipsAllowed();
  const service = GetRelationshipsService(undefined);

  return newRelationshipsAllowed ? service.countByType(id.toString()) : 0;
};

export { getNewRelationshipCount };
