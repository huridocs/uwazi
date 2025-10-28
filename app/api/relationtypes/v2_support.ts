import { ObjectId } from 'mongodb';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultRelationshipDataSource } from 'api/relationships.v2/database/data_source_defaults';
import { CreateTemplateService } from 'api/core/v1_layer/templates.v2/services/service_factories';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';

const getNewRelationshipCount = async (id: ObjectId) => {
  const transactionManager = TransactionManagerFactory.default();
  const newRelationshipsAllowed =
    await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed();
  const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);

  return newRelationshipsAllowed ? relationshipsDataSource.countByType(id.toString()) : 0;
};

const relationTypeIsUsedInQueries = async (id: ObjectId): Promise<boolean> => {
  const transactionManager = TransactionManagerFactory.default();
  const newRelationshipsAllowed =
    await SettingsDataSourceFactory.default(transactionManager).readNewRelationshipsAllowed();
  if (!newRelationshipsAllowed) return false;

  const createTemplateService = await CreateTemplateService();
  const isUsed = await createTemplateService.relationTypeIsUsedInQueries(id.toString());

  return isUsed;
};

export { getNewRelationshipCount, relationTypeIsUsedInQueries };
