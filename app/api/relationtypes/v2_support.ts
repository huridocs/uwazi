import { ObjectId } from 'mongodb';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { CreateTemplateService } from 'api/templates.v2/services/service_factories';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

const getNewRelationshipCount = async (id: ObjectId) => {
  const transactionManager = DefaultTransactionManager();
  const newRelationshipsAllowed =
    await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed();
  const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);

  return newRelationshipsAllowed ? relationshipsDataSource.countByType(id.toString()) : 0;
};

const relationTypeIsUsedInQueries = async (id: ObjectId): Promise<boolean> => {
  const transactionManager = DefaultTransactionManager();
  const newRelationshipsAllowed =
    await DefaultSettingsDataSource(transactionManager).readNewRelationshipsAllowed();
  if (!newRelationshipsAllowed) return false;

  const createTemplateService = await CreateTemplateService();
  const isUsed = await createTemplateService.relationTypeIsUsedInQueries(id.toString());

  return isUsed;
};

export { getNewRelationshipCount, relationTypeIsUsedInQueries };
