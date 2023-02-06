/* eslint-disable max-lines */
import { Application, Request, Response } from 'express';

import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import ixextractors from 'api/services/informationextraction/ixextractors';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { needsAuthorization } from 'api/auth';
import { parseQuery } from 'api/utils/parseQueryMiddleware';
import {
  IXSuggestionsStatsQuerySchema,
  SuggestionsQueryFilterSchema,
} from 'shared/types/suggestionSchema';
import { objectIdSchema } from 'shared/types/commonSchemas';
import { IXSuggestionsFilter } from 'shared/types/suggestionType';
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
        query: {
          type: 'object',
          required: ['filter'],
          properties: {
            filter: SuggestionsQueryFilterSchema,
            page: {
              type: 'object',
              properties: {
                number: { type: 'number', minimum: 1 },
                size: { type: 'number', minimum: 1, maximum: 500 },
              },
            },
          },
        },
      },
    }),
    async (
      req: Request & {
        query: { filter: IXSuggestionsFilter; page: { number: number; size: number } };
      },
      res,
      _next
    ) => {
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
    async (req: Request<{}, {}, {}, { propertyName: string }>, res, _next) => {
      const stats = await Suggestions.getStats(req.query.extractorId);
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
      type: 'object',
      properties: {
        body: {
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

  app.post(
    '/api/ixextractors/create',
    serviceMiddleware,
    needsAuthorization(['admin']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'property', 'templates'],
          properties: {
            name: { type: 'string' },
            property: { type: 'string' },
            templates: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    }),
    async (req, res, _next) => {
      const created = await ixextractors.create(
        req.body.name,
        req.body.property,
        req.body.templates
      );
      res.json(created);
    }
  );

  app.post(
    '/api/ixextractors/update',
    serviceMiddleware,
    needsAuthorization(['admin']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'property', 'templates', '_id'],
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            property: { type: 'string' },
            templates: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    }),
    async (req, res, _next) => {
      const updated = await ixextractors.update(
        req.body._id,
        req.body.name,
        req.body.property,
        req.body.templates
      );
      res.json(updated);
    }
  );

  app.post(
    '/api/ixextractors/delete',
    serviceMiddleware,
    needsAuthorization(['admin']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        body: { type: 'array', items: { type: 'string' } },
      },
    }),
    async (req, res, _next) => {
      await ixextractors.delete(req.body);
      res.sendStatus(200);
    }
  );

  app.get(
    '/api/ixextractors/all',
    serviceMiddleware,
    needsAuthorization(['admin']),
    async (req, res, _next) => {
      const extractors = await ixextractors.get_all();
      res.json(extractors);
    }
  );
};
