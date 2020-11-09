import api from 'app/Users/components/usergroups/UserGroupsAPI';
import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import * as actions from '../actions';

describe('User Groups actions', () => {
  const userGroups = [{ _id: 'group1' }];
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
});
