import type { Route } from '../routing/Route.js';
import { BlankStateRoutes } from './blank-state/BlankStateRoutes.js';
import { ClearTenantRoute } from './routes/ClearTenantRoute.js';
import { ExportTenantRoute } from './routes/ExportTenantRoute.js';
import { ImportTenantRoute } from './routes/ImportTenantRoute.js';
import { UpgradeBackupRoute } from './routes/UpgradeBackupRoute.js';

/** `uwazi db …` — one tenant's PostgreSQL data: clear, export, import, upgrade a backup and the blank state. */
class DbRoutes {
  static all(): Route[] {
    return [
      new ClearTenantRoute(),
      new ExportTenantRoute(),
      new ImportTenantRoute(),
      new UpgradeBackupRoute(),
      ...BlankStateRoutes.all(),
    ];
  }
}

export { DbRoutes };
