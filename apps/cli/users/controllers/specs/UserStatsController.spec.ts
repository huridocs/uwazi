import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RoleCountsOutputSchema } from '../../contracts.js';
import { UserStatsController } from '../UserStatsController.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { fixtures } from './fixtures.js';

describe.each(ControllerSpecs.backends)('UserStatsController ($name)', ({ postgresCore }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    ControllerSpecs.useBackend(postgresCore);
  });

  it('should count active users by role, with a total', async () => {
    const output = await ControllerSpecs.asCli(async () => UserStatsController.handle());

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
