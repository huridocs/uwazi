import { Application, Request } from 'express';
import { validation } from 'api/utils';
import entities from 'api/entities/entities';

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
      const language = req.language || 'en';

      const count = await entities.countByTemplate(templateId as string, language);
      res.json(count);
      res.status(200);
    }
  );
};

export { entitiesRoutes };
