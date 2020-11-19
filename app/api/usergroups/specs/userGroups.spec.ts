import userGroups from 'api/usergroups/userGroups';
import db from 'api/utils/testing_db';
import { models } from 'api/odm/models';
import { UserGroupSchema } from 'shared/types/userGroupType';
import fixtures, { group1Id, group2Id, user1Id, user2Id } from './fixtures.js';

describe('userGroups', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('get', () => {
    it('should return populated user groups from model', async () => {
      const groups = await userGroups.get({}, '', { sort: { name: 1 } });
      expect(groups[0]._id?.toString()).toBe(group1Id.toString());
      expect(groups[0].name).toBe('Group 1');
      expect(groups[0].members.length).toBe(1);
      expect(groups[0].members[0].username).toBe('user2');
      expect(groups[1]._id?.toString()).toBe(group2Id.toString());
      expect(groups[1].members[0].username).toBe('user1');
      expect(groups[1].members[1].username).toBe('user3');
    });
  });

  describe('save', () => {
    it('should create the user group if it does not exists', async () => {
      const newUserGroup = { name: 'new group 1', members: [] };
      const savedUserGroup = await userGroups.save(newUserGroup);
      const storedUserGroup = (await userGroups.get({ name: 'new group 1' }))[0];
      expect(savedUserGroup).toEqual(storedUserGroup);
    });

    it('should save the members, stripping non _id member info', async () => {
      const userGroup1: UserGroupSchema = {
        _id: group1Id.toString(),
        name: 'Group 1 edited',
        members: [{ _id: user1Id.toString(), username: 'wrong name' }, { _id: user2Id.toString() }],
      };

      await userGroups.save(userGroup1);
      const storedUserGroups = await models.usergroups.get({
        _id: group1Id,
        name: 'Group 1 edited',
      });

      expect(storedUserGroups[0].members[0]._id.toString()).toBe(user1Id.toString());
      expect(storedUserGroups[0].members[0].username).toBeUndefined();
      expect(storedUserGroups[0].members[1]._id.toString()).toBe(user2Id.toString());
    });

    it('should allow empty members groups', async () => {
      const userGroup1: UserGroupSchema = {
        _id: group1Id.toString(),
        name: 'Group 1',
        members: [],
      };

      await userGroups.save(userGroup1);
      const storedUserGroup = (await userGroups.get({ _id: group1Id, name: 'Group 1' }))[0];
      expect(storedUserGroup.members.length).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete the user group with by the specified id', async () => {
      await userGroups.delete({ _id: group2Id.toString() });
      const deletedUser = await userGroups.get({ _id: group2Id.toString() });
      expect(deletedUser).toEqual([]);
    });
  });
});
