/* eslint-disable max-statements */
// @ts-expect-error TS(2307): Cannot find module '../authorization.v2/database/d... Remove this comment to see the full error message
import { DefaultPermissionsDataSource } from '../authorization.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../authorization.v2/services/A... Remove this comment to see the full error message
import { AuthorizationService } from '../authorization.v2/services/AuthorizationService.js';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
  
} from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoTra... Remove this comment to see the full error message
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/data_s... Remove this comment to see the full error message
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/data_sour... Remove this comment to see the full error message
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../relationshiptypes.v2/databa... Remove this comment to see the full error message
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { search } from '../search.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/data_... Remove this comment to see the full error message
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../users.v2/model/User.js' or ... Remove this comment to see the full error message
import { User } from 'api/users.v2/model/User.js';

import { UserRole } from 'shared/types/userSchema.js';

// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/configuration/fact... Remove this comment to see the full error message
import { DefaultDispatcher } from '../queue.v2/configuration/factories.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/services/Entity... Remove this comment to see the full error message
import { EntityRelationshipsUpdateService as GenericEntityRelationshipsUpdateService } from '../entities.v2/services/EntityRelationshipsUpdateService.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/services/servic... Remove this comment to see the full error message
import { EntityRelationshipsUpdateService } from '../entities.v2/services/service_factories.js';
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
import { GetMigrationHubRecordsService as GenericGetMigrationHubRecordsService } from './GetMigrationHubRecordsService';
import { GetRelationshipMigrationFieldService as GenericGetRelationshipMigrationFieldsService } from './GetRelationshipMigrationFieldService';
import { GetRelationshipService as GenericGetRelationshipService } from './GetRelationshipService';
import { DenormalizationService as GenericDenormalizationService } from './DenormalizationService';
import { MigrationService as GenericMigrationService } from './MigrationService';
import { OnlineRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/OnlineRelationshipPropertyUpdateStrategy';
import { QueuedRelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/QueuedRelationshipPropertyUpdateStrategy';
import { UpsertRelationshipMigrationFieldService as GenericUpsertRelationshipMigrationFieldService } from './UpsertRelationshipMigrationFieldService';
import { UpdateRelationshipPropertiesJob as GenericUpdateRelationshipPropertiesJob } from './propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob as GenericUpdateTemplateRelationshipPropertiesJob } from './propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
// @ts-expect-error TS(2307): Cannot find module '../permissions/permissionsCont... Remove this comment to see the full error message
import { permissionsContext } from '../permissions/permissionsContext.js';

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
  const transactionManager = DefaultTransactionManager();

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
      EntityRelationshipsUpdateService(transactionManager)
    )
  );

  return service;
};

const GetRelationshipService = () => {
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const permissionsDS = DefaultPermissionsDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
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
  const transactionManager = DefaultTransactionManager();
  const relationshipsDS = DefaultRelationshipDataSource(transactionManager);
  const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
  const entitiesDS = DefaultEntitiesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;
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
  const transactionManager = DefaultTransactionManager();
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

const GetMigrationHubRecordsService = () => {
  const transactionManager = DefaultTransactionManager();
  const hubRecordDS = DefaultMigrationHubRecordDataSource(transactionManager);
  const service = new GenericGetMigrationHubRecordsService(hubRecordDS);
  return service;
};

const UpdateRelationshipPropertiesJob = () => {
  const tenant = tenants.current().name;
  const transactionManager = DefaultTransactionManager();
  const updater = EntityRelationshipsUpdateService(transactionManager);
  const indexEntity = async (sharedIds: string[]) =>
    tenants.run(async () => search.indexEntities({ sharedId: { $in: sharedIds } }), tenant);

  return new GenericUpdateRelationshipPropertiesJob(updater, transactionManager, indexEntity);
};

const UpdateTemplateRelationshipPropertiesJob = async () =>
  new GenericUpdateTemplateRelationshipPropertiesJob(
    DefaultEntitiesDataSource(DefaultTransactionManager()),
    await DefaultDispatcher(tenants.current().name)
  );

export {
  CreateRelationshipMigrationFieldService,
  CreateRelationshipService,
  DeleteRelationshipMigrationFieldService,
  DeleteRelationshipService,
  GetMigrationHubRecordsService,
  GetRelationshipService,
  GetRelationshipMigrationFieldsService,
  DenormalizationService,
  MigrationService,
  UpsertRelationshipMigrationFieldService,
  UpdateRelationshipPropertiesJob,
  UpdateTemplateRelationshipPropertiesJob,
};
