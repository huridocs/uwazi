import { Application, NextFunction, Request, Response } from 'express';

import { MongoPermissionsDataSource } from 'api/authorization.v2/database/MongoPermissionsDataSource';
import { AuthorizationService } from 'api/authorization.v2/services/AuthorizationService';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
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
import { DeleteRelationshipService } from '../services/__sandbox';
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
    async (req, res) => {
      const relationshipInputArray = req.body;
      if (validateRelationshipInputArray(relationshipInputArray)) {
        const user = User.fromRequest(req);
        const connection = getConnection();

        const SettingsDataSource = new MongoSettingsDataSource(connection);
        const TransactionManager = new MongoTransactionManager(getClient());

        const service = new CreateRelationshipService(
          new MongoRelationshipsDataSource(connection),
          new MongoRelationshipTypesDataSource(connection),
          new MongoEntitiesDataSource(connection, SettingsDataSource),
          TransactionManager,
          MongoIdGenerator,
          new AuthorizationService(new MongoPermissionsDataSource(connection), user),
          new DenormalizationService(
            new MongoRelationshipsDataSource(connection),
            new MongoEntitiesDataSource(connection, SettingsDataSource),
            new MongoTemplatesDataSource(connection),
            TransactionManager
          ),
          applicationEventsBus
        );
        const created = await service.createMultiple(relationshipInputArray);
        res.json(created);
      }
    }
  );

  app.delete(
    '/api/relationships.v2',
    featureRequired,
    needsAuthorization(['admin', 'editor']),
    async (req, res) => {
      const idArray = req.body;
      if (validateStringArray(idArray)) {
        const user = User.fromRequest(req);
        const service = DeleteRelationshipService(user);
        const created = await service.deleteMultiple(idArray);
        res.json(created);
      }
    }
  );
};
