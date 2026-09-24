import { config } from '#api/config.js';
import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { DB } from '#api/odm/index.js';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import type { DBTenant } from '#api/tenants/tenantsModel.js';
import { User } from '#api/users.v2/model/User.js';
import { TenantNotFound } from './TenantNotFound.js';

class CliTenancy {
  static async resolve(name: string): Promise<Tenant> {
    const stored = await CliTenancy.collection().findOne({ name }, { projection: { _id: 0 } });

    if (!stored) {
      throw new TenantNotFound(name);
    }

    return CliTenancy.register(stored);
  }

  static async all(): Promise<Tenant[]> {
    const stored = await CliTenancy.collection()
      .find({}, { projection: { _id: 0 }, sort: { name: 1 } })
      .toArray();

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
   * A one-off read of the shared tenants collection. `tenants.setupTenants()` is not used: it
   * opens a change stream that would keep the process alive after the command finishes.
   */
  private static collection() {
    return DB.mongodb_Db(config.SHARED_DB).collection<DBTenant>('tenants');
  }

  /** The legacy tenant context resolves names through this registry. */
  private static register(stored: DBTenant): Tenant {
    tenants.add(stored);
    return tenants.tenants[stored.name];
  }
}

export { CliTenancy };
