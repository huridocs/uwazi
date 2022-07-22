import { Application, Request, Response } from 'express';

import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { needsAuthorization } from 'api/auth';
import { parseQuery } from 'api/utils/parseQueryMiddleware';
import {
  IXSuggestionsQuerySchema,
  IXSuggestionsStatsQuerySchema,
} from 'shared/types/suggestionSchema';
import { objectIdSchema } from 'shared/types/commonSchemas';
import { serviceMiddleware } from './serviceMiddleware';
import { saveConfigurations } from './configurationManager';

const IX = new InformationExtraction();

async function processTrainFunction(
  callback: (property: string) => Promise<{ message: string; status: string }>,
  req: Request,
  res: Response
) {
  if (!IX) {
    res.status(500).json({
      error: 'Information Extraction service is not available',
    });
    return;
  }

  const status = await callback(req.body.property);
  res.json(status);
}

function propertyRequestValidation(root = 'body') {
  return validateAndCoerceRequest({
    type: 'object',
    properties: {
      [root]: {
        type: 'object',
        additionalProperties: false,
        required: ['property'],
        properties: {
          property: { type: 'string' },
        },
      },
    },
  });
}

export const suggestionsRoutes = (app: Application) => {
  app.get(
    '/api/suggestions/',
    serviceMiddleware,
    needsAuthorization(['admin']),
    parseQuery,
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: IXSuggestionsQuerySchema,
      },
    }),
    async (req, res, _next) => {
      const suggestionsList = await Suggestions.get(
        { language: req.language, ...req.query.filter },
        { page: req.query.page }
      );
      res.json(suggestionsList);
    }
  );

  app.get(
    '/api/suggestions/stats',
    serviceMiddleware,
    needsAuthorization(['admin']),
    parseQuery,
    validateAndCoerceRequest({
      properties: {
        query: IXSuggestionsStatsQuerySchema,
      },
    }),
    async (req, res, _next) => {
      const stats = await Suggestions.getStats(req.query.propertyName);
      res.json(stats);
    }
  );

  app.post(
    '/api/suggestions/stop',
    serviceMiddleware,
    needsAuthorization(['admin']),
    propertyRequestValidation('body'),
    async (req, res, _next) => {
      await processTrainFunction(IX.stopModel, req, res);
    }
  );

  app.post(
    '/api/suggestions/train',
    serviceMiddleware,
    needsAuthorization(['admin']),
    propertyRequestValidation('body'),
    async (req, res, _next) => {
      await processTrainFunction(IX.trainModel, req, res);
    }
  );

  app.post(
    '/api/suggestions/configurations',
    needsAuthorization(['admin']),
    validateAndCoerceRequest({
      properties: {
        body: {
          additionalProperties: false,
          properties: {
            configurations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  template: { type: 'string' },
                  properties: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }),
    (req, res, next) => {
      saveConfigurations(req.body)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/suggestions/status',
    serviceMiddleware,
    needsAuthorization(['admin']),
    propertyRequestValidation('body'),
    async (req, res, _next) => {
      await processTrainFunction(IX.status, req, res);
    }
  );

  app.post(
    '/api/suggestions/accept',
    serviceMiddleware,
    needsAuthorization(['admin']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['suggestion', 'allLanguages'],
          properties: {
            suggestion: {
              type: 'object',
              additionalProperties: false,
              required: ['_id', 'sharedId', 'entityId'],
              properties: {
                _id: objectIdSchema,
                sharedId: { type: 'string' },
                entityId: { type: 'string' },
              },
            },
            allLanguages: { type: 'boolean' },
          },
        },
      },
    }),
    async (req, res, _next) => {
      const { suggestion, allLanguages } = req.body;
      await Suggestions.accept(suggestion, allLanguages);
      res.json({ success: true });
    }
  );
};
