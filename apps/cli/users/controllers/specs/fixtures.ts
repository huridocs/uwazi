import { UserRole } from '#api/core/domain/user/User.js';
import { User } from '#api/users.v2/model/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

const f = getFixturesFactory();

const fixtures = {
  users: [
    f.user({ username: 'admin', role: UserRole.ADMIN, email: 'admin@test.com' }),
    f.user({ username: 'editor', role: UserRole.EDITOR, email: 'editor@test.com' }),
    f.user({
      username: 'gone',
      role: UserRole.EDITOR,
      email: 'gone@test.com',
      deletedAt: new Date(),
    }),
  ],
  usergroups: [f.usergroup('Researchers', [{ refId: f.idString('editor') }])],
};

const backends = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

/** Selects the backend the way production does: through the tenant's feature flag. */
const useBackend = (postgresCore: boolean, tenant: { domain?: string } = {}) =>
  testingTenants.changeCurrentTenant({ ...tenant, featureFlags: { postgresCore } });

/** Controllers run inside the tenant the TenantMiddleware selected, as the system actor. */
const asCli = async <T>(fn: () => Promise<T>) =>
  testingEnvironment.runWithContext(fn, { actor: User.system() });

const stored = async (postgresCore: boolean, table: 'users' | 'usergroups' | 'jobs') =>
  postgresCore ? testingEnvironment.pg.getAllFrom(table) : testingEnvironment.db.getAllFrom(table);

export { f, fixtures, backends, useBackend, asCli, stored };
