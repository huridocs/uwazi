import userGroups from 'api/usergroups/userGroups';
import db from 'api/utils/testing_db';
import fixtures, { group2Id, user1Id } from './fixtures.js';

describe('userGroupsMembers', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('getByMemberIdList', () => {
    it('should return the groups that contains the asked member ids', async () => {
      const groups = await userGroups.getByMemberIdList([user1Id.toString()]);
      expect(groups[0]._id?.toString()).toBe(group2Id.toString());
      expect(groups[0].name).toBe('Group 2');
    });
  });
});
