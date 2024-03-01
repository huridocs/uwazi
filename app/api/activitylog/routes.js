import { objectIdSchema } from 'shared/types/commonSchemas';
import { parseQuery, validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import activitylog from './activitylog';

export default app => {
  app.get(
    '/api/activitylog',
    needsAuthorization(['admin']),
    parseQuery,
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          additionalProperties: false,
          type: 'object',
          properties: {
            user: objectIdSchema,
            username: { type: 'string' },
            find: { type: 'string' },
            time: {
              type: 'object',
              properties: {
                from: { type: 'number' },
                to: { type: 'number' },
              },
            },
            before: { type: 'number' },
            limit: { type: 'number' },
            page: { type: 'number', minimum: 1 },
            method: { type: 'array', items: { type: 'string' } },
            search: { type: 'string' },
          },
        },
      },
    }),
    (req, res, next) =>
      activitylog
        .get(req.query)
        .then(response => res.json(response))
        .catch(next)
  );
};
