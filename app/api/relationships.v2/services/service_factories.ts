/* eslint-disable max-statements */
import { DefaultPermissionsDataSource } from 'api/authorization.v2/database/data_source_defaults';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { search } from 'api/search';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { User } from 'api/users.v2/model/User';

import { DefaultRelationshipDataSource } from '../database/data_source_defaults';

import { CreateRelationshipService as GenericCreateRelationshipService } from './CreateRelationshipService';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { GetRelationshipsService as GenericGetRelationshipsService } from './GetRelationshipsService';

const indexEntitiesCallback = async (sharedIds: string[]) => {
  if (sharedIds.length) {
    await search.indexEntities({ sharedId: { $in: sharedIds } });
  }
};

const CreateRelationshipService = (user: User) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const settingsDS = DefaultSettingsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, user);
  const denormalizationService = new GenericDenormalizationService(
    relationshipsDS,
    entitiesDS,
    templatesDS,
    settingsDS,
    transactionManager,
    indexEntitiesCallback
  );

  const service = new GenericCreateRelationshipService(
    relationshipsDS,
    relationshipTypesDS,
    entitiesDS,
    transactionManager,
    idGenerator,
    authService,
    denormalizationService
  );

  return service;
};

const DeleteRelationshipService = (user?: User) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, user);

  const service = new GenericDeleteRelationshipService(
    relationshipsDS,
    transactionManager,
    authService
  );

  return service;
};

const DenormalizationService = () => {
  const transactionManager = DefaultTransactionManager();
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

const GetRelationshipsService = (user?: User) => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);

  const authService = new AuthorizationService(permissionsDS, user);

  const service = new GenericGetRelationshipsService(relationshipsDS, authService);

  return service;
};

export {
  CreateRelationshipService,
  DeleteRelationshipService,
  DenormalizationService,
  GetRelationshipsService,
};
