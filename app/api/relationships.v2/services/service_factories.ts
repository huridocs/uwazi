import { DefaultPermissionsDataSource } from 'api/authorization.v2/database/data_source_defaults';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { applicationEventsBus } from 'api/eventsbus';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { User } from 'api/users.v2/model/User';

import { DefaultRelationshipDataSource } from '../database/data_source_defaults';

import { CreateRelationshipService as GenericCreateRelationshipService } from './CreateRelationshipService';
import { DeleteRelationshipService as GenericDeleteRelationshipService } from './DeleteRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { GetRelationshipsService as GenericGetRelationshipsService } from './GetRelationshipsService';

const CreateRelationshipService = (user: User) => {
  const relationshipsDS = DefaultRelationshipDataSource();
  const relationshipTypesDS = DefaultRelationshipTypesDataSource();
  const entitiesDS = DefaultEntitiesDataSource();
  const transactionManager = DefaultTransactionManager();
  const idGenerator = DefaultIdGenerator;
  const permissionsDS = DefaultPermissionsDataSource();
  const templatesDS = DefaultTemplatesDataSource();

  const authService = new AuthorizationService(permissionsDS, user);
  const denormalizationService = new GenericDenormalizationService(
    relationshipsDS,
    entitiesDS,
    templatesDS,
    transactionManager
  );

  const service = new GenericCreateRelationshipService(
    relationshipsDS,
    relationshipTypesDS,
    entitiesDS,
    transactionManager,
    idGenerator,
    authService,
    denormalizationService,
    applicationEventsBus
  );

  return service;
};

const DeleteRelationshipService = (user?: User) => {
  const relationshipsDS = DefaultRelationshipDataSource();
  const transactionManager = DefaultTransactionManager();
  const permissionsDS = DefaultPermissionsDataSource();

  const authService = new AuthorizationService(permissionsDS, user);

  const service = new GenericDeleteRelationshipService(
    relationshipsDS,
    transactionManager,
    authService
  );

  return service;
};

const DenormalizationService = () => {
  const relationshipsDS = DefaultRelationshipDataSource();
  const entitiesDS = DefaultEntitiesDataSource();
  const templatesDS = DefaultTemplatesDataSource();
  const transactionManager = DefaultTransactionManager();

  const service = new GenericDenormalizationService(
    relationshipsDS,
    entitiesDS,
    templatesDS,
    transactionManager
  );

  return service;
};

const GetRelationshipsService = (user: User) => {
  const relationshipsDS = DefaultRelationshipDataSource();
  const permissionsDS = DefaultPermissionsDataSource();

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
