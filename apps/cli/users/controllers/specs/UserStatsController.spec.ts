import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RoleCountsOutputSchema } from '../../contracts.js';
import { UserStatsController } from '../UserStatsController.js';
import { asCli, backends, fixtures, useBackend } from './fixtures.js';

describe.each(backends)('UserStatsController ($name)', ({ postgresCore }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    useBackend(postgresCore);
  });

  it('should count active users by role, with a total', async () => {
    const output = await asCli(async () => UserStatsController.handle());

    expect(RoleCountsOutputSchema.parse(output)).toEqual({
      admin: 1,
      editor: 1,
      collaborator: 0,
      total: 2,
    });
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
