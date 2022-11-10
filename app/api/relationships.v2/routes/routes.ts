import { Application, NextFunction, Request, Response } from 'express';

import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import {
  validateRelationshipInputArray,
  validateStringArray,
} from './schemas/relationshipInputValidators';
import {
  CreateRelationshipService,
  DeleteRelationshipService,
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
  app.post('/api/relationships.v2', featureRequired, async (req, res) => {
    const relationshipInputArray = req.body;
    if (validateRelationshipInputArray(relationshipInputArray)) {
      const service = CreateRelationshipService(req);
      const created = await service.create(relationshipInputArray);
      res.json(created);
    }
  });

  app.delete('/api/relationships.v2', featureRequired, async (req, res) => {
    const idArray = Array.isArray(req.query.ids) ? req.query.ids : [req.query.ids];
    if (validateStringArray(idArray)) {
      const service = DeleteRelationshipService(req);
      await service.delete(idArray);
      res.status(200).send();
    }
  });
};
