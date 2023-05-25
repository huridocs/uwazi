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
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { search } from 'api/search';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { User } from 'api/users.v2/model/User';
import { Request } from 'express';
import { UserRole } from 'shared/types/userSchema';

import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Queue } from 'api/queue/application/Queue';
import RedisSMQ from 'rsmq';
import Redis from 'redis';
import { config } from 'api/config';
import { StringJobSerializer } from 'api/queue/infrastructure/StringJobSerializer';
import { tenants } from 'api/tenants';
import { DefaultRelationshipDataSource } from '../database/data_source_defaults';

import { CreateRelationshipService as GenericCreateRelationshipService } from './CreateRelationshipService';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';
import { GetRelationshipService as GenericGetRelationshipService } from './GetRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { OnlineRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy';
import { QueuedRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/QueuedRelationshipPropertyUpdateStrategy';

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
  async () =>
    new Promise((resolve, reject) => {
      const redisClient = Redis.createClient(`redis://${config.redis.host}:${config.redis.port}`);
      const RSMQ = new RedisSMQ({ client: redisClient });

      redisClient.on('connect', () =>
        resolve(
          new QueuedRelationshipPropertyUpdateStrategy(
            new Queue('uwazi_jobs', RSMQ, StringJobSerializer, {
              namespace: tenants.current().name,
            })
          )
        )
      );
      redisClient.on('error', e => {
        console.log(e);
        return reject(e);
      });
    });

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

  const newRelationshipsSettings = await settingsDS.getFeatureConfiguration('newRelationships');

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

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));

  const service = new GenericGetRelationshipService(relationshipsDS, authService, entitiesDS);

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

export {
  CreateRelationshipService,
  DeleteRelationshipService,
  GetRelationshipService,
  DenormalizationService,
};
