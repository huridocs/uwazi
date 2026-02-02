import { ActivityLogGetRequestSchema } from '#shared/types/activityLogApiSchemas.js';

import { parseQuery, validation } from '#api/utils/index.js';
import needsAuthorization from '#api/auth/authMiddleware.js';
import activitylog from './activitylog.js';

export default app => {
  app.get(
    '/api/activitylog',
    needsAuthorization(['admin']),
    parseQuery,
    validation.validateRequest(ActivityLogGetRequestSchema),
    (req, res, next) =>
      activitylog
        .get(req.query)
        .then(response => res.json(response))
        .catch(next)
  );
};
