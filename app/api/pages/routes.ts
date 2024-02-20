import { Application, Request } from 'express';

import { validation } from 'api/utils';
import needsAuthorization from '../auth/authMiddleware';
import pages from './pages';

export default (app: Application) => {
  app.post('/api/pages', needsAuthorization(['admin']), (req, res, next) => {
    pages
      .save(req.body, req.user, req.language)
      .then(response => res.json(response))
      .catch(next);
  });

  app.get(
    '/api/pages',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: {
              type: 'string',
            },
          },
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      pages
        .get({ ...req.query, language: req.language })
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.get(
    '/api/page',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: {
              type: 'string',
            },
            slug: {
              type: 'string',
            },
          },
        },
      },
      required: ['query'],
    }),
    (req: Request<{}, {}, {}, { sharedId: string }>, res, next) => {
      pages.getById(req.query.sharedId, req.language).then(res.json.bind(res)).catch(next);
    }
  );

  app.delete(
    '/api/pages',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            sharedId: {
              type: 'string',
            },
          },
        },
      },
      required: ['query'],
    }),
    (req: Request<{}, {}, {}, { sharedId: string }>, res, next) => {
      pages
        .delete(req.query.sharedId)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
