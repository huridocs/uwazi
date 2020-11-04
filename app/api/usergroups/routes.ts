import { Application, Request, Response } from 'express';
import userGroups from 'api/usergroups/userGroups';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { userGroupSchema } from 'shared/types/userGroupSchema';

export default (app: Application) => {
  app.get(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (_req: Request, res: Response) => {
      const groups = await userGroups.get({});
      res.json(groups);
    }
  );

  app.post(
    '/api/usergroups',
    needsAuthorization(['admin']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          ...userGroupSchema,
        },
      },
    }),
    async (req: Request, res: Response) => {
      const updatedGroup = await userGroups.save(req.body);
      res.json(updatedGroup);
    }
  );
};
