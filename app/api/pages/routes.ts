import type { Application, Request } from 'express';

import { PublishPageReleaseController } from '#api/pages/infrastructure/express/PublishPageReleaseController.js';
import { RestorePageDraftController } from '#api/pages/infrastructure/express/RestorePageDraftController.js';
import { validation } from '#api/utils/index.js';
import needsAuthorization from '../auth/authMiddleware.js';
import pages from './pages.js';

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
            mode: {
              type: 'string',
              enum: ['editor'],
            },
          },
          required: ['sharedId'],
        },
      },
      required: ['query'],
    }),
    (req: Request<{}, {}, {}, { sharedId: string; mode?: 'editor' }>, res, next) => {
      pages
        .getById({ sharedId: req.query.sharedId }, req.language, req.query.mode)
        .then(res.json.bind(res))
        .catch(next);
    }
  );

  app.post(
    '/api/pages/release',
    needsAuthorization(['admin']),
    PublishPageReleaseController.createHandler()
  );

  app.post(
    '/api/pages/restore',
    needsAuthorization(['admin']),
    RestorePageDraftController.createHandler()
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
