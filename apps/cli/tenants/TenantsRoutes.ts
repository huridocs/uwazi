import type { Route } from '../routing/Route.js';
import { ListTenantsRoute } from './routes/ListTenantsRoute.js';
import { GetTenantRoute } from './routes/GetTenantRoute.js';
import { RegisterTenantRoute } from './routes/RegisterTenantRoute.js';
import { UpdateTenantRoute } from './routes/UpdateTenantRoute.js';
import { DeleteTenantRoute } from './routes/DeleteTenantRoute.js';
import { SetFeatureFlagsRoute } from './routes/SetFeatureFlagsRoute.js';
import { SetMaintenanceRoute } from './routes/SetMaintenanceRoute.js';
import { UpdateStatsRoute } from './routes/UpdateStatsRoute.js';
import { RecordHealthCheckRoute } from './routes/RecordHealthCheckRoute.js';

/** `uwazi tenants …` — the registry, which sits above every tenant context. */
class TenantsRoutes {
  static all(): Route[] {
    return [
      new ListTenantsRoute(),
      new GetTenantRoute(),
      new RegisterTenantRoute(),
      new UpdateTenantRoute(),
      new DeleteTenantRoute(),
      new SetFeatureFlagsRoute(),
      new SetMaintenanceRoute(),
      new UpdateStatsRoute(),
      new RecordHealthCheckRoute(),
    ];
  }
}

export { TenantsRoutes };
