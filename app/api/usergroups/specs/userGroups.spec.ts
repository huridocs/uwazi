import Ajv from 'ajv';
import userGroups from 'api/usergroups/userGroups';
import db from 'api/utils/testing_db';
import { models } from 'api/odm';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { UserSchema } from 'shared/types/userType';
import { fixtures, group1Id, group2Id, user1Id, user2Id } from './fixtures';

describe('userGroups', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('get', () => {
    it('should return populated user groups from model', async () => {
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
        members: [{ refId: user1Id.toString() }, { refId: user2Id.toString() }],
      };

      await userGroups.save(userGroup1);
      const storedUserGroups = await models.usergroups.get({
        _id: group1Id,
        name: 'Group 1 edited',
      });

      expect(storedUserGroups[0].members[0].refId.toString()).toBe(user1Id.toString());
      expect(storedUserGroups[0].members[0].username).toBeUndefined();
      expect(storedUserGroups[0].members[1].refId.toString()).toBe(user2Id.toString());
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

    it('should throw a validation error when the group has a duplicated name', async () => {
      const newUserGroup = { name: 'Group 1', members: [] };
      try {
        await userGroups.save(newUserGroup);
        fail('should throw a validation error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
        expect(e.errors[0].keyword).toEqual('uniqueName');
      }
    });
  });

  describe('save multiple', () => {
    it('should save a list of user groups', async () => {
      const userGroup1: UserGroupSchema = {
        _id: group1Id.toString(),
        name: 'Group 1 M',
        members: [{ refId: user1Id.toString() }],
      };
      const userGroup2: UserGroupSchema = {
        _id: group2Id.toString(),
        name: 'Group 2 M',
        members: [{ refId: user2Id.toString() }],
      };
      await userGroups.saveMultiple([userGroup1, userGroup2]);
      const storedUserGroups: UserGroupSchema[] = await models.usergroups.get({});
      expect(storedUserGroups[0].name).toBe('Group 1 M');
      expect(storedUserGroups[0].members[0].refId).toEqual(user1Id.toString());
      expect((storedUserGroups[0].members[0] as Partial<UserSchema>).username).toBeUndefined();
      expect(storedUserGroups[1].name).toBe('Group 2 M');
      expect(storedUserGroups[1].members[0].refId).toEqual(user2Id.toString());
      expect((storedUserGroups[0].members[0] as Partial<UserSchema>).username).toBeUndefined();
    });
  });
  describe('delete', () => {
    it('should delete the user group with by the specified id', async () => {
      await userGroups.delete({ _id: group2Id.toString() });
      const groups = await userGroups.get({});
      expect(groups.length).toBe(1);
      expect(groups[0]._id).toEqual(group1Id);
    });

    it('should delete the user groups with by the specified ids', async () => {
      await userGroups.delete({ _id: { $in: [group1Id.toString(), group2Id.toString()] } });
      const groups = await userGroups.get({});
      expect(groups.length).toBe(0);
    });
  });
});
