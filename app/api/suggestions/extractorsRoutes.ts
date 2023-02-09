import { needsAuthorization } from 'api/auth';
import ixextractors from 'api/services/informationextraction/ixextractors';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { Application } from 'express';
import { serviceMiddleware } from './serviceMiddleware';

export const extractorsRoutes = (app: Application) => {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req, res, _next) => {
      const extractors = await ixextractors.get_all();
      res.json(extractors);
    }
  );
};
