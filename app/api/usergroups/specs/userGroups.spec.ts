import userGroups from 'api/usergroups/userGroups';
import db from 'api/utils/testing_db';
import fixtures, { group1Id, user1Id, user2Id } from './fixtures.js';

describe('userGroups', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('get', () => {
    it('should return user groups from model', async () => {
      const groups = await userGroups.get({});
      expect(groups[0]._id).toEqual(group1Id);
      expect(groups[0].name).toBe('Group 1');
      expect(groups[0].members.length).toBe(1);
      expect(groups[0].members[0].username).toBe('user1');
    });
  });

  describe('save', () => {
    it('should create the user group if it does not exists', async () => {
      const newUserGroup = { name: 'new group 1', members: [] };
      const savedUserGroup = await userGroups.save(newUserGroup);
      const storedUserGroup = (await userGroups.get({ name: 'new group 1' }))[0];
      expect(savedUserGroup).toEqual(storedUserGroup);
    });

    it('should create the added users of the group', async () => {
      const userGroup1 = {
        _id: group1Id,
        name: 'Group 1',
        members: [user1Id, user2Id],
      };
      // @ts-ignore
      await userGroups.save(userGroup1);
      const storedUserGroup = (await userGroups.get({ _id: group1Id, name: 'Group 1' }))[0];
      expect(storedUserGroup.members.length).toBe(2);
      expect(storedUserGroup.members[1]._id).toEqual(user2Id);
    });

    it('should delete the removed users of the group', async () => {
      const userGroup1 = {
        _id: group1Id,
        name: 'Group 1',
        members: [],
      };
      // @ts-ignore
      await userGroups.save(userGroup1);
      const storedUserGroup = (await userGroups.get({ _id: group1Id, name: 'Group 1' }))[0];
      expect(storedUserGroup.members.length).toBe(0);
    });
  });
});
