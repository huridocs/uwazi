import { ObjectId } from 'mongodb';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';

const getNewRelationshipCount = async (id: ObjectId) => {
  const transactionManager = new MongoTransactionManager(getClient());
  const newRelationshipsAllowed = await DefaultSettingsDataSource(
    transactionManager
  ).readNewRelationshipsAllowed();
  const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);

  return newRelationshipsAllowed ? relationshipsDataSource.countBy({ type: id.toString() }) : 0;
};

export { getNewRelationshipCount };
