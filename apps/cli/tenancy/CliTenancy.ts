import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import type { TenantRecord } from '#api/tenants/application/contracts/TenantsDataSource.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { TenantsDataSourceFactory } from '#api/tenants/infrastructure/TenantsDataSourceFactory.js';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import { User } from '#api/users.v2/model/User.js';

class CliTenancy {
  static async resolve(name: string): Promise<Tenant> {
    const stored = await TenantsDataSourceFactory.default().getByName(name);

    if (!stored) {
      throw new TenantNotFound(name);
    }

    return CliTenancy.register(stored);
  }

  static async all(): Promise<Tenant[]> {
    const stored = await TenantsDataSourceFactory.default().all();

    return stored.map(CliTenancy.register);
  }

  /** Runs as the system actor, logging to stderr so stdout stays reserved for output. */
  static async run<R>(tenant: Tenant, fn: () => Promise<R>): Promise<R> {
    return ExecutionContextFactory.runForTenant(
      tenant.name,
      {
        actor: User.system(),
        telemetry: { kind: 'cli' },
        overrides: { logger: LoggerFactory.cli },
      },
      fn
    );
  }

  /**
   * The legacy tenant context resolves names through this registry. Reads go through the data
   * source rather than `tenants.setupTenants()`, which opens a change stream that would keep the
   * process alive after the command finishes.
   */
  private static register(stored: TenantRecord): Tenant {
    tenants.add(stored);
    return tenants.tenants[stored.name];
  }
}

export { CliTenancy };
