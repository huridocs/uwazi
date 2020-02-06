/** @format
 * Uwazi routes that fetch Topic Classification information.
 */
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { Application, Request, Response } from 'express';
import Joi from 'joi';

import topicClassification from './topicClassification';

export const CLASSIFIER_MODELS_ENDPOINT = 'models';
const tcModelPrefix = `/api/${CLASSIFIER_MODELS_ENDPOINT}`;

export default (app: Application) => {
  app.get(
    tcModelPrefix,
    needsAuthorization(),
    validation.validateRequest(Joi.object().keys({ model: Joi.string() })),

    async (req: Request, res: Response) => {
      const model = await topicClassification.getModelForThesaurus(req.query?.model);
      return res.json(model);
    }
  );
};
