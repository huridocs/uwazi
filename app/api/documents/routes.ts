import { Application, Request, Response, NextFunction } from 'express';

import { validation } from 'api/utils';
import { documents } from './documents';

export const documentRoutes = (app: Application) => {
  app.get(
    '/api/documents/page',

    validation.validateRequest({
      properties: {
        query: {
          properties: {
            _id: { type: 'string' },
            page: { type: 'string' },
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
