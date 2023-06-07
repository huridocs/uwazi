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

import {
  DefaultHubsDataSource,
  DefaultRelationshipDataSource,
  DefaultV1ConnectionsDataSource,
} from '../database/data_source_defaults';

import { CreateRelationshipService as GenericCreateRelationshipService } from './CreateRelationshipService';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';
import { GetRelationshipService as GenericGetRelationshipService } from './GetRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { MigrationService as GenericMigrationService } from './MigrationService';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';

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

const DenormalizationService = (transactionManager: MongoTransactionManager) => {
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const settingsDS = DefaultSettingsDataSource(transactionManager);

  const service = new GenericDenormalizationService(
    relationshipsDS,
    entitiesDS,
    templatesDS,
    settingsDS,
    transactionManager,
    indexEntitiesCallback
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

const CreateRelationshipService = (request: Request) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const filesDS = DefaultFilesDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));
  const denormalizationService = DenormalizationService(transactionManager);

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

const DeleteRelationshipService = (request: Request) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, userFromRequest(request));
  const denormService = DenormalizationService(transactionManager);

  const service = new GenericDeleteRelationshipService(
    relationshipsDS,
    transactionManager,
    authService,
    denormService
  );

  return service;
};

const MigrationService = () => {
  const transactionManager = DefaultTransactionManager();
  const hubDS = DefaultHubsDataSource(transactionManager);
  const v1ConnectionsDS = DefaultV1ConnectionsDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const service = new GenericMigrationService(
    MongoIdHandler,
    hubDS,
    v1ConnectionsDS,
    templatesDS,
    relationshipsDS
  );
  return service;
};

export {
  CreateRelationshipService,
  DeleteRelationshipService,
  GetRelationshipService,
  DenormalizationService,
  MigrationService,
};
