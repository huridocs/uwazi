import { Application, NextFunction, Request, Response } from 'express';

import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getValidatorMiddleware } from 'api/common.v2/validation/ajvInstances';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { applicationEventsBus } from 'api/eventsbus';
import { MongoRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/MongoRelationshipTypesDataSource';
import { User } from 'api/users.v2/model/User';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import needsAuthorization from '../../auth/authMiddleware';
import { MongoRelationshipsDataSource } from '../database/MongoRelationshipsDataSource';
import {
  validateRelationshipInputArray,
  validateStringArray,
} from './schemas/relationshipInputValidators';
import { CreateRelationshipService } from '../services/CreateRelationshipService';
import { DeleteRelationshipService } from '../services/DeleteRelationshipService';
import { DenormalizationService } from '../services/DenormalizationService';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const featureRequired = async (req: Request, res: Response, next: NextFunction) => {
  const db = getConnection();
  if (!(await new MongoSettingsDataSource(db).readNewRelationshipsAllowed())) {
    return res.sendStatus(404);
  }
  next();
};

export default (app: Application) => {
  app.post(
    '/api/relationships.v2',
    featureRequired,
    needsAuthorization(['admin', 'editor']),
    getValidatorMiddleware(validateRelationshipInputArray),
    async (req, res) => {
      const user = User.fromRequest(req);
      const connection = getConnection();

      const SettingsDataSource = new MongoSettingsDataSource(connection);

      const service = new CreateRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoRelationshipTypesDataSource(connection),
        new MongoEntitiesDataSource(connection, SettingsDataSource),
        new MongoTransactionManager(getClient()),
        MongoIdGenerator,
        new AuthorizationService(new MongoPermissionsDataSource(connection), user),
        new DenormalizationService(
          new MongoRelationshipsDataSource(connection),
          new MongoEntitiesDataSource(connection, SettingsDataSource),
          new MongoTemplatesDataSource(connection),
          new MongoTransactionManager(getClient())
        ),
        applicationEventsBus
      );
      const created = await service.createMultiple(req.body);
      res.json(created);
    }
  );

  app.delete(
    '/api/relationships.v2',
    featureRequired,
    needsAuthorization(['admin', 'editor']),
    getValidatorMiddleware(validateStringArray),
    async (req, res) => {
      const user = User.fromRequest(req);
      const connection = getConnection();

      const service = new DeleteRelationshipService(
        new MongoRelationshipsDataSource(connection),
        new MongoTransactionManager(getClient()),
        new AuthorizationService(new MongoPermissionsDataSource(connection), user)
      );
      const created = await service.deleteMultiple(req.body);
      res.json(created);
    }
  );
};
