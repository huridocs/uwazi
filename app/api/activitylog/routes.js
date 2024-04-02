import { ActivityLogGetRequestSchema } from 'shared/types/activityLogApiSchemas';

import { parseQuery, validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import activitylog from './activitylog';

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
