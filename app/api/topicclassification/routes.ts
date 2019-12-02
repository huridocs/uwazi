/** @format */

import { Application, NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { getAllModels } from './topicClassification';

const tcUrlPrefix = '/api/models';

export default (app: Application) => {
  app.get(
    tcUrlPrefix,
    needsAuthorization(),
    validation.validateRequest(Joi.object()),
    (_req: Request, res: Response, next: NextFunction) => {
      getAllModels()
        .then(models => res.json(models))
        .catch(next);
    }
  );
};
