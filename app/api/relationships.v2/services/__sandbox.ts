import { Db } from 'mongodb';

import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { User } from 'api/users.v2/model/User';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { applicationEventsBus } from 'api/eventsbus';
import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';

import { MongoRelationshipsDataSource } from '../database/MongoRelationshipsDataSource';
import { CreateRelationshipService } from './CreateRelationshipService';
import { DenormalizationService } from './DenormalizationService';
import { DeleteRelationshipService } from './DeleteRelationshipService';

const MongoCreateRelationshipService = (db: Db, user: User) => {
  const client = getClient();
  const transactionManager = new MongoTransactionManager(client);
  const relDS = new MongoRelationshipsDataSource(db);
  const settingsDS = new MongoSettingsDataSource(db);
  const entDS = new MongoEntitiesDataSource(db, settingsDS);

  return new CreateRelationshipService(
    relDS,
    new MongoRelationshipTypesDataSource(db),
    entDS,
    transactionManager,
    MongoIdGenerator,
    new AuthorizationService(new MongoPermissionsDataSource(db), user),
    new DenormalizationService(relDS, entDS, new MongoTemplatesDataSource(db), transactionManager),
    applicationEventsBus
  );
};

const MongoDeleteRelationshipService = (db: Db, user: User) =>
  new DeleteRelationshipService(
    new MongoRelationshipsDataSource(db),
    new MongoTransactionManager(getClient()),
    new AuthorizationService(new MongoPermissionsDataSource(db), user)
  );

const DefaultCreateRelationshipService = (db: Db, user: User) =>
  MongoCreateRelationshipService(db, user);

const DefaultDeleteRelationshipService = (db: Db, user: User) =>
  MongoDeleteRelationshipService(db, user);

class DefaultRelationshipServices {
  private _db: Db;

  private _user: User;

  private _createService: CreateRelationshipService;

  private _deleteService: DeleteRelationshipService;

  constructor(db: Db, user: User) {
    this._db = db;
    this._user = user;
    this._createService = DefaultCreateRelationshipService(db, user);
    this._deleteService = DefaultDeleteRelationshipService(db, user);
  }

  async createMultiple(relationships: { from: string; to: string; type: string }[]) {
    return this._createService.createMultiple(relationships);
  }

  async deleteMultiple(ids: string[]) {
    return this._deleteService.deleteMultiple(ids);
  }

  async delete(id: string) {
    return this._deleteService.delete(id);
  }
}

export {
  DefaultCreateRelationshipService,
  DefaultDeleteRelationshipService,
  DefaultRelationshipServices,
};
