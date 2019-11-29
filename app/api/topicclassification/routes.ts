/** @format */

import { Application, NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { modelReady } from './topicClassification';

const tcUrlPrefix = '/api/topics';

export default (app: Application) => {
  app.get(
    tcUrlPrefix,
    needsAuthorization(),
    validation.validateRequest(
      Joi.object()
        .keys({
          model: Joi.string().required(),
        })
        .required()
    ),
    (req: Request, res: Response, next: NextFunction) => {
      modelReady(req.query.model)
        .then(models => res.json(models))
        .catch(next);
    }
  );
};
