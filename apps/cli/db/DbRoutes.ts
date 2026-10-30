import type { Route } from '../routing/Route.js';
import { BlankStateRoutes } from './blank-state/BlankStateRoutes.js';
import { ClearTenantRoute } from './routes/ClearTenantRoute.js';
import { ExportTenantRoute } from './routes/ExportTenantRoute.js';
import { ImportTenantRoute } from './routes/ImportTenantRoute.js';

/** `uwazi db …` — one tenant's PostgreSQL data: clear, export, import and the blank state. */
class DbRoutes {
  static all(): Route[] {
    return [
      new ClearTenantRoute(),
      new ExportTenantRoute(),
      new ImportTenantRoute(),
      ...BlankStateRoutes.all(),
    ];
  }
}

export { DbRoutes };
