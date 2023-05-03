import { Application, NextFunction, Request, Response } from 'express';

import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import {
  CreateRelationshipService,
  DeleteRelationshipService,
} from '../services/service_factories';
import { validateCreateRelationship } from './validators/createRelationship';
import { validateDeleteRelationships } from './validators/deleteRelationships';
import { parseQuery } from 'api/utils';

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
  app.post('/api/v2/relationships', featureRequired, async (req, res) => {
    const relationships = validateCreateRelationship(req.body);
    const service = CreateRelationshipService(req);
    const created = await service.create(relationships);
    res.json(created);
  });

  app.delete('/api/v2/relationships', featureRequired, parseQuery, async (req, res) => {
    const relationshipsIds = validateDeleteRelationships(req.query);
    const service = DeleteRelationshipService(req);
    await service.delete(relationshipsIds.ids);
    res.status(200).send();
  });
};
