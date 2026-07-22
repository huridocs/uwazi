import type { Application, Request } from 'express';
import { validation } from '#api/utils/index.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';

const entitiesRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            templateId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          },
          required: ['templateId'],
        },
      },
      required: ['query'],
    }),
    async (req: Request, res) => {
      const { templateId } = req.query;

      const count = await EntitiesDAOFactory.default({
        user: User.createFrom(req.user),
      }).countByTemplate(templateId as string);
      res.json(count);
      res.status(200);
    }
  );
};

export { entitiesRoutes };
