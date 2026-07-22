import type { Application, Request, Response, NextFunction } from 'express';

import { validateAndCoerceRequest } from '#api/utils/validateRequest.js';
import { documents } from './documents.js';

export const documentRoutes = (app: Application) => {
  app.get(
    '/api/documents/page',
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            page: { type: 'number' },
          },
        },
      },
    }),

    async (req: Request, res: Response, next: NextFunction) => {
      documents
        .page(req.query._id, req.query.page)
        .then((result: string) => {
          res.json({ data: result });
        })
        .catch(next);
    }
  );

  app.get(
    '/api/documents/fulltext',
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request, res: Response, next: NextFunction) => {
      documents
        .fullText(req.query._id)
        .then((result: string) => {
          res.json({ data: result });
        })
        .catch(next);
    }
  );
};
