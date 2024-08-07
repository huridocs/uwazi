import { needsAuthorization } from 'api/auth';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import { parseQuery } from 'api/utils';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { Application, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { ensure } from 'shared/tsUtils';
import { serviceMiddleware } from './serviceMiddleware';

export const extractorsRoutes = (app: Application) => {
  app.post(
    '/api/ixextractors',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
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
      const created = await Extractors.create(req.body.name, req.body.property, req.body.templates);
      res.json(created);
    }
  );

  app.put(
    '/api/ixextractors',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
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
      const updated = await Extractors.update(
        req.body._id,
        req.body.name,
        req.body.property,
        req.body.templates
      );
      res.json(updated);
    }
  );

  app.delete(
    '/api/ixextractors',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    parseQuery,
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          required: ['ids'],
          properties: { ids: { type: 'array', items: { type: 'string' } } },
        },
      },
    }),
    async (req: Request & { query: { ids: string[] } }, res: Response, _next: NextFunction) => {
      const extractorIds: string[] = ensure<string[]>(req.query.ids);
      await Extractors.delete(extractorIds);
      res.sendStatus(200);
    }
  );

  app.get(
    '/api/ixextractors',
    serviceMiddleware,
    needsAuthorization(['admin', 'editor']),
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
          },
        },
      },
    }),
    async (req, res, _next) => {
      if (req.query.id) {
        const extractor = await Extractors.get({ _id: new ObjectId(req.query.id as string) });
        res.json(extractor);
      } else {
        const extractors = await Extractors.get_all();
        res.json(extractors);
      }
    }
  );
};
