import type { Application, Request } from 'express';
import { validation } from '#api/utils/index.js';
import { EntityCountByTemplateQueryServiceFactory } from '#api/core/infrastructure/factories/EntityCountByTemplateQueryServiceFactory.js';
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
      const counts = EntityCountByTemplateQueryServiceFactory.default();
      const { templateId } = req.query;
      res.json(templateId ? await counts.one({ templateId }) : await counts.all());
    }
  );
};

export { entitiesRoutes };
