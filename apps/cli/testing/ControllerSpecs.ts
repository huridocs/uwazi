import { User } from '#api/users.v2/model/User.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

/** What every CLI controller spec needs: both backends, the CLI's context, stored state. */
class ControllerSpecs {
  static readonly backends = [
    { name: 'Mongo', postgresCore: false },
    { name: 'Postgres', postgresCore: true },
  ];

  /** Selects the backend the way production does: through the tenant's feature flag. */
  static useBackend(postgresCore: boolean, tenant: { domain?: string } = {}) {
    testingTenants.changeCurrentTenant({ ...tenant, featureFlags: { postgresCore } });
  }

  /** Controllers run inside the tenant the TenantMiddleware selected, as the system actor. */
  static async asCli<T>(fn: () => Promise<T>): Promise<T> {
    return testingEnvironment.runWithContext(fn, { actor: User.system() });
  }

  static async stored(postgresCore: boolean, table: string) {
    return postgresCore
      ? testingEnvironment.pg.getAllFrom(table)
      : testingEnvironment.db.getAllFrom(table);
  }
}

export { ControllerSpecs };
