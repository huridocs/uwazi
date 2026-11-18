import { userGroupsRoutes } from '#api/core/infrastructure/express/userGroups/routes.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';

import { ServerApiError } from '../../../application/ServerApiError.js';
import { ParityHarness, callers } from './ParityHarness.js';

const factory = getFixturesFactory();
const harness = new ParityHarness(userGroupsRoutes);

describe('user groups client', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
      users: [factory.user({ username: 'alice', role: UserRole.EDITOR })],
      usergroups: [factory.usergroup('Team', [{ refId: factory.idString('alice') }])],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('getAll should match GET /api/usergroups for an admin', async () => {
    const http = await harness.as(callers.admin).http('/api/usergroups');
    const client = await harness.as(callers.admin).client(async c => c.userGroups.getAll());

    expect(http.status).toBe(200);
    expect(client).toEqual(http.body);
    expect(client).toMatchObject([{ name: 'Team', members: [{ username: 'alice' }] }]);
  });

  it('getAll should be forbidden to editors, like GET /api/usergroups', async () => {
    const http = await harness.as(callers.editor).http('/api/usergroups');
    const failure = harness.as(callers.editor).client(async c => c.userGroups.getAll());

    expect(http.status).toBe(401);
    await expect(failure).rejects.toBeInstanceOf(ServerApiError);
    await expect(failure).rejects.toMatchObject({ status: 401, body: http.body });
  });
});
