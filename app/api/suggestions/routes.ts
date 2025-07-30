import { Application, Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { needsAuthorization } from 'api/auth';
import { parseQuery } from 'api/utils/parseQueryMiddleware';
import { SuggestionsQueryFilterSchema } from 'shared/types/suggestionSchema';
import { objectIdSchema } from 'shared/types/commonSchemas';
import {
  IXAggregationQuery,
  IXSuggestionAggregation,
  IXSuggestionsQuery,
} from 'shared/types/suggestionType';
import { handleError } from 'api/utils';
import { serviceMiddleware } from './serviceMiddleware';
import { GetSuggestionsForTableQuery } from './getSuggestionsForTableQuery/getSuggestionsForTableQuery';
import { FindSuggestionsForIds } from './useCases/FindSuggestionsForIds';

const IX = new InformationExtraction();

function extractorIdRequestValidation(root = 'body') {
  return validateAndCoerceRequest({
    type: 'object',
    properties: {
      [root]: {
        type: 'object',
        additionalProperties: false,
        required: ['extractorId'],
        properties: {
          extractorId: { type: 'string' },
        },
      },
    },
  });
}

const findSuggestionsRequestValidation = validateAndCoerceRequest({
  type: 'object',
  properties: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['extractorId', 'sharedIds'],
      properties: {
        extractorId: { type: 'string' },
        sharedIds: { type: 'array', items: { type: 'string' } },
      },
    },
  },
});

export const suggestionsRoutes = (app: Application) => {
  app.get(
    '/api/suggestions/',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
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
            sort: {
              type: 'object',
              properties: {
                property: { type: 'string' },
                order: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    async (
      req: Request & {
        query: IXSuggestionsQuery;
      },
      res: Response
    ) => {
      const query = new GetSuggestionsForTableQuery();

      const result = await query.execute({
        extractorId: req.query.filter.extractorId.toString(),
        filter: req.query.filter.customFilter,
        sort: req.query.sort,
        pagination: req.query.page,
      });

      res.json(result);
    }
  );

  app.get(
    '/api/suggestions/aggregation',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    parseQuery,
    validateAndCoerceRequest({
      type: 'object',
      definitions: { objectIdSchema },
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          required: ['extractorId'],
          properties: {
            extractorId: objectIdSchema,
          },
        },
      },
    }),
    async (
      req: Request & {
        query: IXAggregationQuery;
      },
      res: Response<IXSuggestionAggregation>
    ) => {
      const { extractorId } = req.query;
      const aggregation = await Suggestions.aggregate(extractorId);
      res.json(aggregation);
    }
  );

  app.post(
    '/api/suggestions/stop',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      const status = await IX.stopModel(ObjectId.createFromHexString(req.body.extractorId));
      res.json(status);
    }
  );

  app.post(
    '/api/suggestions/train',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      const output = await IX.trainModel(ObjectId.createFromHexString(req.body.extractorId));
      res.status(202).json(output);
    }
  );

  app.post(
    '/api/suggestions/test_model',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      const output = await IX.testModel(ObjectId.createFromHexString(req.body.extractorId));

      res.status(202).json(output);
    }
  );

  app.post(
    '/api/suggestions/find',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    findSuggestionsRequestValidation,
    async (req, res, _next) => {
      const { extractorId, sharedIds } = req.body;
      const findSuggestionsForIds = new FindSuggestionsForIds(IX);
      const output = await findSuggestionsForIds.execute({
        extractorId: ObjectId.createFromHexString(extractorId),
        sharedIds,
      });
      res.status(202).json(output);
    }
  );

  app.post(
    '/api/suggestions/status',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      const status = await IX.status(ObjectId.createFromHexString(req.body.extractorId));
      res.json(status);
    }
  );

  app.post(
    '/api/suggestions/accept',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['suggestions'],
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['_id', 'sharedId', 'entityId'],
                properties: {
                  _id: objectIdSchema,
                  sharedId: { type: 'string' },
                  entityId: { type: 'string' },
                  addedValues: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  removedValues: {
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
    async (req, res, _next) => {
      const { suggestions } = req.body;

      res.status(202).json({ success: true });

      Suggestions.accept(suggestions)
        .then(() => req.emitToSessionSocket('ACCEPT_SUGGESTION_SUCCESS'))
        .catch(e => {
          const error = handleError(e);
          req.emitToSessionSocket('ACCEPT_SUGGESTION_ERROR', error.message);
        });
    }
  );
};
