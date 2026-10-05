import type { Application, Request } from 'express';
import { validation } from '#api/utils/index.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { ObjectIdAsString, ObjectIdListAsString } from '#api/utils/ajvSchemas.js';

const entitiesRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            templateId: ObjectIdAsString,
            templateIds: ObjectIdListAsString,
          },
          anyOf: [{ required: ['templateId'] }, { required: ['templateIds'] }],
        },
      },
      required: ['query'],
    }),
    async (req: Request<{}, {}, {}, { templateId: string } | { templateIds: string }>, res) => {
      const dao = EntitiesDAOFactory.default({ user: User.createFrom(req.user) });

      if ('templateId' in req.query) {
        res.json(await dao.countByTemplate(req.query.templateId));
        return;
      }

      const ids = req.query.templateIds.split(',');
      res.json(
        Object.fromEntries(
          await Promise.all(ids.map(async id => [id, await dao.countByTemplate(id)]))
        )
      );
    }
  );
};

export { entitiesRoutes };
