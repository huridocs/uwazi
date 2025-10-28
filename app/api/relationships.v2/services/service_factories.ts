/* eslint-disable max-statements */
import { DefaultPermissionsDataSource } from 'api/authorization.v2/database/data_source_defaults';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { search } from 'api/search';
import { User } from 'api/users.v2/model/User';
import { UserRole } from 'shared/types/userSchema';

import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/service_factories';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants';
import {
  DefaultHubsDataSource,
  DefaultMigrationHubRecordDataSource,
  DefaultRelationshipDataSource,
  DefaultRelationshipMigrationFieldsDataSource,
  DefaultV1ConnectionsDataSource,
} from '../database/data_source_defaults';
import { CreateRelationshipMigrationFieldService as GenericCreateRelationshipMigrationFieldService } from './CreateRelationshipMigrationFieldService';
import { CreateRelationshipService as GenericCreateRelationshipService } from './CreateRelationshipService';
import { DeleteRelationshipMigrationFieldService as GenericDeleteRelationshipMigrationFieldService } from './DeleteRelationshipMigrationFieldService';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { GetMigrationHubRecordsService as GenericGetMigrationHubRecordsService } from './GetMigrationHubRecordsService';
import { GetRelationshipMigrationFieldService as GenericGetRelationshipMigrationFieldsService } from './GetRelationshipMigrationFieldService';
import { GetRelationshipService as GenericGetRelationshipService } from './GetRelationshipService';
import { MigrationService as GenericMigrationService } from './MigrationService';
import { OnlineRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy';
import { QueuedRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/QueuedRelationshipPropertyUpdateStrategy';
import { UpdateRelationshipPropertiesJob as GenericUpdateRelationshipPropertiesJob } from './propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob as GenericUpdateTemplateRelationshipPropertiesJob } from './propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
import { UpsertRelationshipMigrationFieldService as GenericUpsertRelationshipMigrationFieldService } from './UpsertRelationshipMigrationFieldService';

const indexEntitiesCallback = async (sharedIds: string[]) => {
  if (sharedIds.length) {
    await search.indexEntities({ sharedId: { $in: sharedIds } });
  }
};

const userFromRequest = () => {
  const user = permissionsContext.getUserInContext();
  if (user) {
    const groups = user.groups?.map((g: any) => g._id.toHexString());
    if (!user._id) {
      throw new Error('Provided user does not have an _id');
    }
    return new User(user._id.toString(), user.role as UserRole, groups ?? []);
  }

  return undefined;
};

const buildQueuedRelationshipPropertyUpdateStrategy: () => Promise<QueuedRelationshipPropertyUpdateStrategy> =
  async () =>
    new QueuedRelationshipPropertyUpdateStrategy(await DefaultDispatcher(tenants.current().name));

const createUpdateStrategy = async (
  strategyKey: string | undefined,
  updater: GenericEntityRelationshipsUpdateService
) => {
  const transactionManager = TransactionManagerFactory.default();

  switch (strategyKey) {
    case QueuedRelationshipPropertyUpdateStrategy.name:
      return buildQueuedRelationshipPropertyUpdateStrategy();
    case OnlineRelationshipPropertyUpdateStrategy.name:
    case undefined:
      return new OnlineRelationshipPropertyUpdateStrategy(
        indexEntitiesCallback,
        updater,
        transactionManager,
        DefaultEntitiesDataSource(transactionManager)
      );
    default:
      throw new Error(`${strategyKey} is not a valid DenormalizationStrategy`);
  }
};

const DenormalizationService = async (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);

  const newRelationshipsSettings = await settingsDS.getNewRelationshipsConfiguration();

  const service = new GenericDenormalizationService(
    relationshipsDS,
    entitiesDS,
    templatesDS,
    settingsDS,
    transactionManager,
    indexEntitiesCallback,
    await createUpdateStrategy(
      newRelationshipsSettings.updateStrategy,
      EntityRelationshipsUpdateService(transactionManager)
    )
  );

  return service;
};

const GetRelationshipService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const relationshipTypeDS = DefaultRelationshipTypesDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest());

  const service = new GenericGetRelationshipService(
    relationshipsDS,
    authService,
    entitiesDS,
    templatesDS,
    relationshipTypeDS
  );

  return service;
};

const CreateRelationshipService = async () => {
  const transactionManager = TransactionManagerFactory.default();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const idGenerator = IdGeneratorFactory.default();
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const filesDS = DefaultFilesDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest());
  const denormalizationService = await DenormalizationService(transactionManager);

  const service = new GenericCreateRelationshipService(
    relationshipsDS,
    relationshipTypesDS,
    entitiesDS,
    filesDS,
    transactionManager,
    idGenerator,
    authService,
    denormalizationService
  );

  return service;
};

const DeleteRelationshipService = async () => {
  const transactionManager = TransactionManagerFactory.default();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest());
  const denormService = await DenormalizationService(transactionManager);

  const service = new GenericDeleteRelationshipService(
    relationshipsDS,
    transactionManager,
    authService,
    denormService
  );

  return service;
};

const MigrationService = () => {
  const logger = LoggerFactory.default();
  const transactionManager = TransactionManagerFactory.default();
  const hubDS = DefaultHubsDataSource(transactionManager);
  const v1ConnectionsDS = DefaultV1ConnectionsDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const hubRecordDS = DefaultMigrationHubRecordDataSource(transactionManager);
  const service = new GenericMigrationService(
    MongoIdHandler,
    hubDS,
    v1ConnectionsDS,
    templatesDS,
    relationshipsDS,
    hubRecordDS,
    logger
  );
  return service;
};

const DeleteRelationshipMigrationFieldService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericDeleteRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

const GetRelationshipMigrationFieldsService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
  const service = new GenericGetRelationshipMigrationFieldsService(
    transactionManager,
    fieldDS,
    templatesDS
  );
  return service;
};

const CreateRelationshipMigrationFieldService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericCreateRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

const UpsertRelationshipMigrationFieldService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericUpsertRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

const GetMigrationHubRecordsService = () => {
  const transactionManager = TransactionManagerFactory.default();
  const hubRecordDS = DefaultMigrationHubRecordDataSource(transactionManager);
  const service = new GenericGetMigrationHubRecordsService(hubRecordDS);
  return service;
};

const UpdateRelationshipPropertiesJob = () => {
  const tenant = tenants.current().name;
  const transactionManager = TransactionManagerFactory.default();
  const updater = EntityRelationshipsUpdateService(transactionManager);
  const indexEntity = async (sharedIds: string[]) =>
    tenants.run(async () => search.indexEntities({ sharedId: { $in: sharedIds } }), tenant);

  return new GenericUpdateRelationshipPropertiesJob(updater, transactionManager, indexEntity);
};

const UpdateTemplateRelationshipPropertiesJob = async () =>
  new GenericUpdateTemplateRelationshipPropertiesJob(
    DefaultEntitiesDataSource(TransactionManagerFactory.default()),
    await DefaultDispatcher(tenants.current().name)
  );

export {
  CreateRelationshipMigrationFieldService,
  CreateRelationshipService,
  DeleteRelationshipMigrationFieldService,
  DeleteRelationshipService,
  DenormalizationService,
  GetMigrationHubRecordsService,
  GetRelationshipMigrationFieldsService,
  GetRelationshipService,
  MigrationService,
  UpdateRelationshipPropertiesJob,
  UpdateTemplateRelationshipPropertiesJob,
  UpsertRelationshipMigrationFieldService,
};
