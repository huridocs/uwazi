import { objectIdSchema } from '#shared/types/commonSchemas.js';
import { legacyLogger } from '#api/log/index.js';
import { validation } from '../utils/index.js';
import templates from '../core/v1_layer/templates/index.js';

export default app => {
  app.get(
    '/api/documents/count_by_template',
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['templateId'],
          additionalProperties: false,
          properties: {
            templateId: objectIdSchema,
          },
        },
      },
    }),
    (req, res, next) => {
      legacyLogger.info(
        'The endpoint /api/documents/count_by_template is deprecated. Please use /api/v2/entities/count_by_template instead.'
      );
      templates
        .countByTemplate(req.query.templateId)
        .then(results => res.json(results))
        .catch(next);
    }
  );
};
