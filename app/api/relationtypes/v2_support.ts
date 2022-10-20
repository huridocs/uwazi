import { ObjectId } from 'mongodb';

import { GetRelationshipsService } from 'api/relationships.v2/services/service_factories';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

const getNewRelationshipCount = async (id: ObjectId) => {
  const newRelationshipsAllowed = await DefaultSettingsDataSource().readNewRelationshipsAllowed();
  const service = GetRelationshipsService(undefined);

  return newRelationshipsAllowed ? service.countByType(id.toString()) : 0;
};

export { getNewRelationshipCount };
