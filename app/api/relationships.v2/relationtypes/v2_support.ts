import { ObjectId } from 'mongodb';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultRelationshipDataSource } from '../database/data_source_defaults.js';
import { CreateTemplateService } from '../templates.v2/services/service_factories.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const getNewRelationshipCount = async (id: ObjectId) => {
  const transactionManager = TransactionManagerFactory.default();
  const newRelationshipsAllowed = await SettingsDataSourceFactory.default({
    transactionManager,
  }).readNewRelationshipsAllowed();
  const relationshipsDataSource = DefaultRelationshipDataSource(transactionManager);

  return newRelationshipsAllowed ? relationshipsDataSource.countByType(id.toString()) : 0;
};

const relationTypeIsUsedInQueries = async (id: ObjectId): Promise<boolean> => {
  const transactionManager = TransactionManagerFactory.default();
  const newRelationshipsAllowed = await SettingsDataSourceFactory.default({
    transactionManager,
  }).readNewRelationshipsAllowed();
  if (!newRelationshipsAllowed) return false;

  const createTemplateService = await CreateTemplateService();
  const isUsed = await createTemplateService.relationTypeIsUsedInQueries(id.toString());

  return isUsed;
};

export { getNewRelationshipCount, relationTypeIsUsedInQueries };
