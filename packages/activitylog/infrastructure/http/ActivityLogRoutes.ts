import type { Application } from 'express';
import { parseQuery } from '#api/utils/index.js';
import { ListActivityLogController } from './ListActivityLogController.js';

class ActivityLogRoutes {
  static register(this: void, app: Application) {
    app.get('/api/activitylog', parseQuery, ListActivityLogController.createHandler());
  }
}

export { ActivityLogRoutes };
