import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import * as api from '../../PermissionsAPI';
import * as actions from '../actions';

jest.mock('app/Users/components/usergroups/UserGroupsAPI');

describe('Permissions actions', () => {
  let dispatch: Dispatch<IStore>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'savePermissions').and.returnValue(Promise.resolve({}));
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('Save permissions', () => {
    it('should dispatch a notification of success', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['sharedId1'],
        permissions: [],
      };
      await actions.saveEntitiesPermissions(permissionsData)(dispatch);
      expect(notificationActions.notify).toHaveBeenCalledWith('Update success', 'success');
    });
  });
});
