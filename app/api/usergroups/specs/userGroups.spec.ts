import userGroups from '#api/usergroups/userGroups.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UserSchema } from '#shared/types/userType.js';
import { fixtures, group1Id, group2Id } from './fixtures.js';

describe('userGroups', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('get', () => {
    // The member lookup goes through UsersDirectory when `usersDirectory` is on and through
    // the legacy users.get otherwise (plan 05 step 2). Both must populate members the same
    // way — UserView's `_id` is a string where the mongoose document's is an ObjectId, and
    // that difference has to stay invisible here.
    it.each([
      { path: 'legacy users.get', usersDirectory: false },
      { path: 'UsersDirectory', usersDirectory: true },
    ])('should return populated user groups from model ($path)', async ({ usersDirectory }) => {
      testingTenants.changeCurrentTenant({ featureFlags: { usersDirectory } });

      const groups = await userGroups.get({}, '', { sort: { name: 1 } });
      expect(groups[0]._id?.toString()).toBe(group1Id.toString());
      expect(groups[0].name).toBe('Group 1');
      const membersGroup1 = groups[0].members as Partial<UserSchema>[];
      const membersGroup2 = groups[1].members as Partial<UserSchema>[];

      expect(groups[0].members.length).toBe(1);
      expect(membersGroup1[0].username).toBe('user2');
      expect(groups[1]._id?.toString()).toBe(group2Id.toString());
      expect(membersGroup2[0].username).toBe('user1');
      expect(membersGroup2[1].username).toBe('user3');
    });
  });
});
