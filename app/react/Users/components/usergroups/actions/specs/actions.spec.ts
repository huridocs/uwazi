import api from 'app/Users/components/usergroups/UserGroupsAPI';
import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { RequestParams } from 'app/utils/RequestParams';
import * as actions from '../actions';

describe('User Groups actions', () => {
  const group2: UserGroupSchema = {
    _id: 'group2',
    name: 'Group 2',
    members: [{ _id: 'user1' }],
  };
  const userGroups = [{ _id: 'group1', members: [{ _id: 'user1' }, { _id: 'user2' }] }, group2];
  const newUserGroup: UserGroupSchema = {
    name: 'new group',
    members: [{ _id: 'user2' }],
  };
  let dispatch: Dispatch<IStore>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'getUserGroups').and.returnValue(Promise.resolve(userGroups));
  });

  describe('Load user groups', () => {
    it('should dispatch the fetched user groups ', async () => {
      await actions.loadUserGroups()(dispatch);
      expect(api.getUserGroups).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'userGroups/SET', value: userGroups });
    });
  });

  describe('Save user group', () => {
    describe('New user group', () => {
      it('should dispatch a push action with a new user group ', async () => {
        spyOn(api, 'saveUserGroup').and.returnValue(
          Promise.resolve({ ...newUserGroup, _id: 'group3' })
        );
        await actions.saveUserGroup(newUserGroup)(dispatch);
        expect(api.saveUserGroup).toHaveBeenCalledWith(new RequestParams(newUserGroup));
        expect(dispatch).toHaveBeenCalledWith({
          type: 'userGroups/PUSH',
          value: { ...newUserGroup, _id: 'group3' },
        });
      });
    });
    describe('Existing user group', () => {
      it('should dispatch an update action keeping group members detail ', async () => {
        const updatedGroup2 = {
          ...group2,
          name: 'Group 2 updated',
          members: [{ _id: 'user1', username: 'User 1' }],
        };
        spyOn(api, 'saveUserGroup').and.returnValue(
          Promise.resolve({ ...group2, name: 'Group 2 updated' })
        );
        await actions.saveUserGroup(updatedGroup2)(dispatch);
        expect(api.saveUserGroup).toHaveBeenCalledWith(new RequestParams(updatedGroup2));
        expect(dispatch).toHaveBeenCalledWith({
          type: 'userGroups/UPDATE',
          value: updatedGroup2,
        });
      });
    });
  });
});
