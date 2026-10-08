import type { Application, Request } from 'express';
import { validation } from '#api/utils/index.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { ObjectIdAsString } from '#api/utils/ajvSchemas.js';

const countOneByTemplate = async (user: User, templateId: string): Promise<number> =>
  EntitiesDAOFactory.default({ user }).countByTemplate(templateId);

const countAllByTemplate = async (user: User): Promise<Record<string, number>> => {
  const dao = EntitiesDAOFactory.default({ user });
  const templates = await TemplatesDAOFactory.default().get();
  return Object.fromEntries(
    await Promise.all(
      templates.map(async (template): Promise<[string, number]> => {
        const id = template._id.toString();
        return [id, await dao.countByTemplate(id)];
      })
    )
  );
};

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
      const user = User.createFrom(req.user);
      const { templateId } = req.query;
      res.json(
        templateId ? await countOneByTemplate(user, templateId) : await countAllByTemplate(user)
      );
    }
  );
};

export { entitiesRoutes, countOneByTemplate, countAllByTemplate };
