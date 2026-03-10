import { Application, Request, Response, NextFunction } from 'express';

import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { documents } from './documents';

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
};
