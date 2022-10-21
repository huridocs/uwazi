import { Application, NextFunction, Request, Response } from 'express';

import { User } from 'api/users.v2/model/User';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import {
  validateRelationshipInputArray,
  validateString,
  validateStringArray,
} from './schemas/relationshipInputValidators';
import needsAuthorization from '../../auth/authMiddleware';
import {
  CreateRelationshipService,
  DeleteRelationshipService,
  GetRelationshipsService,
} from '../services/service_factories';

const featureRequired = async (_req: Request, res: Response, next: NextFunction) => {
  if (
    !(await DefaultSettingsDataSource(
      new MongoTransactionManager(getClient())
    ).readNewRelationshipsAllowed())
  ) {
    return res.sendStatus(404);
  }
  return next();
};

export default (app: Application) => {
  app.get(
    '/api/relationships.v2',
    featureRequired,
    needsAuthorization(['admin', 'editor']),
    async (req, res) => {
      const sharedId = req.body;
      if (validateString(sharedId)) {
        const user = User.fromRequest(req);

        const service = GetRelationshipsService(user);

        const got = await service.getByEntity(sharedId);
        res.json(got);
      }
    }
  );

  app.post(
    '/api/relationships.v2',
    featureRequired,
    needsAuthorization(['admin', 'editor']),
    async (req, res) => {
      const relationshipInputArray = req.body;
      if (validateRelationshipInputArray(relationshipInputArray)) {
        const user = User.fromRequest(req);

        const service = CreateRelationshipService(user);

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
        await service.delete(idArray);
        res.status(200);
      }
    }
  );
};
