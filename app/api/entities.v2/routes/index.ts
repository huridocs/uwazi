import { Application, Request } from 'express';
// @ts-expect-error TS(2307): Cannot find module '../utils/index.js' or its corr... Remove this comment to see the full error message
import { validation } from '../utils/index.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/entities.js' or it... Remove this comment to see the full error message
import entities from '../entities/entities.js';

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
