import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { parseQuery, validation } from '#api/utils/index.js';
import { ActivityLogGetRequestSchema } from '#shared/types/activityLogApiSchemas.js';
import { ListActivityLogController } from './ListActivityLogController.js';

class ActivityLogRoutes {
  static register(this: void, app: Application) {
    app.get(
      '/api/activitylog',
      needsAuthorization(['admin']),
      parseQuery,
      validation.validateRequest(ActivityLogGetRequestSchema),
      ListActivityLogController.createHandler()
    );
  }
}

export { ActivityLogRoutes };
