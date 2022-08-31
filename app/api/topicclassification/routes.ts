/**
 * Uwazi routes that fetch Topic Classification information.
 */
import { needsAuthorization } from 'api/auth';
import thesauri from 'api/thesauri';
import {
  getModelForThesaurus,
  getTrainStateForThesaurus,
  startTraining,
} from 'api/topicclassification/api';
import { validation } from 'api/utils';
import { Application, Request, Response } from 'express';
import { TaskStatus } from '../../shared/tasks/tasks';

// Register tasks.
require('./sync');

export const CLASSIFIER_MODELS_ENDPOINT = 'models';
const tcModelPrefix = `/api/${CLASSIFIER_MODELS_ENDPOINT}`;

export default (app: Application) => {
  app.get(
    tcModelPrefix,
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      required: ['query'],
      properties: {
        query: {
          type: 'object',
          required: ['thesaurus'],
          properties: {
            thesaurus: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request<{}, {}, {}, { thesaurus: string }>, res: Response) => {
      try {
        const model = await getModelForThesaurus(req.query.thesaurus);
        return res.json(model);
      } catch (e) {
        return res.json({});
      }
    }
  );
  app.get(
    `${tcModelPrefix}/train`,
    validation.validateRequest({
      type: 'object',
      required: ['query'],
      properties: {
        query: {
          type: 'object',
          required: ['thesaurus'],
          properties: {
            thesaurus: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request<{}, {}, {}, { thesaurus: string }>, res: Response) => {
      try {
        const status = await getTrainStateForThesaurus(req.query.thesaurus);
        return res.json(status);
      } catch (e) {
        return res.json({ state: 'undefined', result: {} } as TaskStatus);
      }
    }
  );

  app.post(
    `${tcModelPrefix}/train`,
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      required: ['body'],
      properties: {
        body: {
          type: 'object',
          required: ['thesaurusId'],
          properties: {
            thesaurusId: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request, res: Response) => {
      try {
        const thes = await thesauri.getById(req.body!.thesaurusId);
        if (!thes) {
          return res.json({ state: 'undefined', result: {} } as TaskStatus);
        }
        const status = await startTraining(thes);
        return res.json(status);
      } catch (e) {
        return res.json({ state: 'undefined', result: {} } as TaskStatus);
      }
    }
  );
};
