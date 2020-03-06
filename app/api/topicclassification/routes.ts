/** @format
 * Uwazi routes that fetch Topic Classification information.
 */
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { Application, Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import {
  getTrainStateForThesaurus,
  getModelForThesaurus,
  startTraining,
} from 'api/topicclassification/api';
import thesauri from 'api/thesauri';

// Register tasks.
require('./sync');

export const CLASSIFIER_MODELS_ENDPOINT = 'models';
const tcModelPrefix = `/api/${CLASSIFIER_MODELS_ENDPOINT}`;

export default (app: Application) => {
  app.get(
    tcModelPrefix,
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({ thesaurus: Joi.string().required() }), 'query'),

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const model = await getModelForThesaurus(req.query!.thesaurus);
        return res.json(model);
      } catch (e) {
        return next(e);
      }
    }
  );
  app.get(
    `${tcModelPrefix}/train`,
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({ thesaurus: Joi.string().required() }), 'query'),

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const status = await getTrainStateForThesaurus(req.query!.thesaurus);
        return res.json(status);
      } catch (e) {
        return next(e);
      }
    }
  );

  app.post(
    `${tcModelPrefix}/train`,
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({ thesaurusId: Joi.string().required() })),

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const thes = await thesauri.getById(req.body!.thesaurusId);
        if (!thes) {
          return res.sendStatus(404);
        }
        const status = await startTraining(thes);
        return res.json(status);
      } catch (e) {
        return next(e);
      }
    }
  );
};
