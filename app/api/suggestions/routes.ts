/* eslint-disable max-lines */
import { Application, Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { Suggestions } from 'api/suggestions/suggestions';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { needsAuthorization } from 'api/auth';
import { parseQuery } from 'api/utils/parseQueryMiddleware';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { SuggestionsQueryFilterSchema } from 'shared/types/suggestionSchema';
import { objectIdSchema } from 'shared/types/commonSchemas';
import {
  IXAggregationQuery,
  IXSuggestionAggregation,
  IXSuggestionsQuery,
} from 'shared/types/suggestionType';
import { serviceMiddleware } from './serviceMiddleware';

const IX = new InformationExtraction();

async function processTrainFunction(
  callback: (extractorId: ObjectIdSchema) => Promise<{ message: string; status: string }>,
  req: Request,
  res: Response
) {
  if (!IX) {
    res.status(500).json({
      error: 'Information Extraction service is not available',
    });
    return;
  }

  const status = await callback(new ObjectId(req.body.extractorId));
  res.json(status);
}

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

// eslint-disable-next-line max-statements
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
      const suggestionsList = await Suggestions.get(req.query.filter, {
        page: req.query.page,
        sort: req.query.sort,
      });
      res.json(suggestionsList);
    }
  );

  app.get(
    '/api/suggestions/aggregation',
    serviceMiddleware,
    needsAuthorization(['admin']),
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
    needsAuthorization(['admin']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      await processTrainFunction(IX.stopModel, req, res);
    }
  );

  app.post(
    '/api/suggestions/train',
    serviceMiddleware,
    needsAuthorization(['admin']),
    extractorIdRequestValidation('body'),
    async (req, res, _next) => {
      await processTrainFunction(IX.trainModel, req, res);
    }
  );

  app.post(
    '/api/suggestions/status',
    serviceMiddleware,
    needsAuthorization(['admin']),
    extractorIdRequestValidation('body'),
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
      await Suggestions.accept(suggestions);
      res.json({ success: true });
    }
  );
};
