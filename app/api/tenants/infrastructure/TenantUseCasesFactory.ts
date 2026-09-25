import { DeregisterTenant } from '../application/DeregisterTenant.js';
import { GetTenant } from '../application/GetTenant.js';
import { ListTenants } from '../application/ListTenants.js';
import { RecordTenantHealthCheck } from '../application/RecordTenantHealthCheck.js';
import { RegisterTenant } from '../application/RegisterTenant.js';
import { SetTenantFeatureFlags } from '../application/SetTenantFeatureFlags.js';
import { SetTenantMaintenance } from '../application/SetTenantMaintenance.js';
import { UpdateTenant } from '../application/UpdateTenant.js';
import { UpdateTenantStats } from '../application/UpdateTenantStats.js';
import { TenantsDataSourceFactory } from './TenantsDataSourceFactory.js';

/**
 * Wiring for the registry use cases. They run above tenant context, so they take no execution
 * context and there is nothing else to inject.
 */
class TenantUseCasesFactory {
  static registerTenant(): RegisterTenant {
    return new RegisterTenant(TenantsDataSourceFactory.default());
  }

  static updateTenant(): UpdateTenant {
    return new UpdateTenant(TenantsDataSourceFactory.default());
  }

  static deregisterTenant(): DeregisterTenant {
    return new DeregisterTenant(TenantsDataSourceFactory.default());
  }

  static listTenants(): ListTenants {
    return new ListTenants(TenantsDataSourceFactory.default());
  }

  static getTenant(): GetTenant {
    return new GetTenant(TenantsDataSourceFactory.default());
  }

  static setTenantFeatureFlags(): SetTenantFeatureFlags {
    return new SetTenantFeatureFlags(TenantsDataSourceFactory.default());
  }

  static setTenantMaintenance(): SetTenantMaintenance {
    return new SetTenantMaintenance(TenantsDataSourceFactory.default());
  }

  static updateTenantStats(): UpdateTenantStats {
    return new UpdateTenantStats(TenantsDataSourceFactory.default());
  }

  static recordTenantHealthCheck(): RecordTenantHealthCheck {
    return new RecordTenantHealthCheck(TenantsDataSourceFactory.default());
  }
}

export { TenantUseCasesFactory };
