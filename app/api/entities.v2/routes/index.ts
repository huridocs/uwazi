import type { Application, Request } from 'express';
import { validation } from '#api/utils/index.js';
import { EntitiesQueryServiceFactory } from '#api/core/infrastructure/factories/EntitiesQueryServiceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { ObjectIdAsString } from '#api/utils/ajvSchemas.js';

const entitiesRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          properties: {
            templateId: ObjectIdAsString,
          },
        },
      },
      required: ['query'],
    }),
    async (req: Request<{}, {}, {}, { templateId?: string }>, res) => {
      const counts = EntitiesQueryServiceFactory.default(User.createFrom(req.user ?? null));
      const { templateId } = req.query;
      res.json(
        templateId ? await counts.countByTemplate({ templateId }) : await counts.countByTemplates()
      );
    }
  );
};

export { entitiesRoutes };
