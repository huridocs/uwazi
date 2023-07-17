/* eslint-disable max-statements */
import { DefaultPermissionsDataSource } from 'api/authorization.v2/database/data_source_defaults';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { search } from 'api/search';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { User } from 'api/users.v2/model/User';
import { Request } from 'express';
import { UserRole } from 'shared/types/userSchema';

import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Queue } from 'api/queue.v2/application/Queue';
import RedisSMQ from 'rsmq';
import { StringJobSerializer } from 'api/queue.v2/infrastructure/StringJobSerializer';
import { tenants } from 'api/tenants';
import { JobsRouter } from 'api/queue.v2/infrastructure/JobsRouter';
import { ApplicationRedisClient } from 'api/queue.v2/infrastructure/ApplicationRedisClient';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
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
import { GetRelationshipMigrationFieldService as GenericGetRelationshipMigrationFieldsService } from './GetRelationshipMigrationFieldService';
import { GetRelationshipService as GenericGetRelationshipService } from './GetRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { MigrationService as GenericMigrationService } from './MigrationService';
import { OnlineRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy';
import { QueuedRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/QueuedRelationshipPropertyUpdateStrategy';
import { UpsertRelationshipMigrationFieldService as GenericUpsertRelationshipMigrationFieldService } from './UpsertRelationshipMigrationFieldService';

const indexEntitiesCallback = async (sharedIds: string[]) => {
  if (sharedIds.length) {
    await search.indexEntities({ sharedId: { $in: sharedIds } });
  }
};

const userFromRequest = (request: Request) => {
  const { user } = request as any;
  if (user) {
    const groups = user.groups?.map((g: any) => g._id.toHexString());
    return new User(user._id.toHexString(), user.role as UserRole, groups ?? []);
  }

  return undefined;
};

const buildQueuedRelationshipPropertyUpdateStrategy: () => Promise<QueuedRelationshipPropertyUpdateStrategy> =
  async () => {
    const redisClient = await ApplicationRedisClient.getInstance();
    const RSMQ = new RedisSMQ({ client: redisClient });

    return new QueuedRelationshipPropertyUpdateStrategy(
      new JobsRouter(
        queueName =>
          new Queue(queueName, RSMQ, StringJobSerializer, {
            namespace: tenants.current().name,
          })
      )
    );
  };

const createUpdateStrategy = async (
  strategyKey: string | undefined,
  updater: EntityRelationshipsUpdateService
) => {
  const transactionManager = new MongoTransactionManager(getClient());

  switch (strategyKey) {
    case QueuedRelationshipPropertyUpdateStrategy.name:
      return buildQueuedRelationshipPropertyUpdateStrategy();
    case OnlineRelationshipPropertyUpdateStrategy.name:
    case undefined:
      return new OnlineRelationshipPropertyUpdateStrategy(
        indexEntitiesCallback,
        updater,
        transactionManager
      );
    default:
      throw new Error(`${strategyKey} is not a valid DenormalizationStrategy`);
  }
};

const DenormalizationService = async (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const settingsDS = DefaultSettingsDataSource(transactionManager);

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
      new EntityRelationshipsUpdateService(entitiesDS, templatesDS, relationshipsDS)
    )
  );

  return service;
};

const GetRelationshipService = (request: Request) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const relationshipTypeDS = DefaultRelationshipTypesDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));

  const service = new GenericGetRelationshipService(
    relationshipsDS,
    authService,
    entitiesDS,
    templatesDS,
    relationshipTypeDS
  );

  return service;
};

const CreateRelationshipService = async (request: Request) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const filesDS = DefaultFilesDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));
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

const DeleteRelationshipService = async (request: Request) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));
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
  const logger = DefaultLogger();
  const transactionManager = DefaultTransactionManager();
  const hubDS = DefaultHubsDataSource(transactionManager);
  const v1ConnectionsDS = DefaultV1ConnectionsDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
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
  const transactionManager = DefaultTransactionManager();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericDeleteRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

const GetRelationshipMigrationFieldsService = () => {
  const transactionManager = DefaultTransactionManager();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const service = new GenericGetRelationshipMigrationFieldsService(
    transactionManager,
    fieldDS,
    templatesDS
  );
  return service;
};

const CreateRelationshipMigrationFieldService = () => {
  const transactionManager = DefaultTransactionManager();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericCreateRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

const UpsertRelationshipMigrationFieldService = () => {
  const transactionManager = DefaultTransactionManager();
  const fieldDS = DefaultRelationshipMigrationFieldsDataSource(transactionManager);
  const service = new GenericUpsertRelationshipMigrationFieldService(transactionManager, fieldDS);
  return service;
};

export {
  CreateRelationshipMigrationFieldService,
  CreateRelationshipService,
  DeleteRelationshipMigrationFieldService,
  DeleteRelationshipService,
  GetRelationshipService,
  GetRelationshipMigrationFieldsService,
  DenormalizationService,
  MigrationService,
  UpsertRelationshipMigrationFieldService,
};
