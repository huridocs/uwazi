import { Application, Request, Response, NextFunction } from 'express';

import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import { validation } from 'api/utils';
import entities from 'api/entities';

import needsAuthorization from '../auth/authMiddleware';

export default (app: Application) => {
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

  app.post(
    '/api/attachments/external',
    needsAuthorization(['admin', 'editor']),
    activitylogMiddleware,
    validation.validateRequest({
      properties: {
        body: {
          properties: {
            entityId: { type: 'string' },
            allLanguages: { type: 'boolean' },
            originalname: { type: 'string' },
            url: { type: 'string' },
            mimetype: { type: 'string' },
          },
        },
      },
    }),
    async (req: Request, res: Response) => {
      const { entityId, originalname, mimetype, url } = req.body;
      const newAttachment = { originalname, mimetype, url };
      const entity = await entities.getById(entityId);
      if (entity) {
        const _attachments = entity.attachments || [];
        _attachments.push({ originalname, mimetype, url });
        await entities.saveMultiple([{ ...entity, attachments: _attachments }]);
        res.json(newAttachment);
      }
    }
  );
};
