/** @format */

import { Application, NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { getAllModels, modelReady } from './topicClassification';

const tcUrlPrefix = '/api/models';

export default (app: Application) => {
  app.get(
    tcUrlPrefix,
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({ model: Joi.string() })),
    (req: Request, res: Response, next: NextFunction) => {
      if (typeof req.query.model === 'undefined') {
        getAllModels()
          .then(models => res.json(models))
          .catch(next);
        return;
      }
      modelReady(req.query.model)
        .then(models => res.json(models))
        .catch(next);
    }
  );
};
