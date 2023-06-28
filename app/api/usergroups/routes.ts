import { Application, NextFunction, Request, Response } from 'express';
import { needsAuthorization } from 'api/auth';
import { parseQuery, validation } from 'api/utils';
import userGroups from './userGroups';

export default (app: Application) => {
  app.get(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const groups = await userGroups.get({});
        res.json(groups);
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (req: Request, res: Response) => {
      const userGroup = await userGroups.save(req.body);
      res.json(userGroup);
    }
  );

  app.delete(
    '/api/usergroups',
    needsAuthorization(['admin']),
    parseQuery,
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          required: ['ids'],
          properties: {
            ids: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          },
        },
      },
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ids } = req.query;
        const idsArray = Array.isArray(ids) ? ids : [ids];
        const deletedGroup = await userGroups.delete({ _id: { $in: idsArray } });
        res.json(deletedGroup);
      } catch (err) {
        next(err);
      }
    }
  );
};
