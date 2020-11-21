import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import userGroupsAPI from '../UserGroupsAPI';

jest.mock('app/utils/api', () => ({
  get: jest.fn().mockResolvedValue({ json: { code: 200 } }),
  post: jest.fn().mockResolvedValue({ json: { code: 200 } }),
  delete: jest.fn().mockResolvedValue({ json: { code: 200 } }),
}));

describe('UserGroupsAPI', () => {
  describe('getUserGroups', () => {
    it('should call get method of usergroups api', async () => {
      const response = await userGroupsAPI.getUserGroups(new RequestParams());
      expect(api.get).toHaveBeenCalledWith('usergroups', { data: undefined, headers: {} });
      expect(response.code).toBe(200);
    });
  });

  describe('saveUserGroup', () => {
    it('should call post method of usergroups api', async () => {
      const response = await userGroupsAPI.saveUserGroup(
        new RequestParams({ name: 'Group 1', members: [] })
      );
      expect(api.post).toHaveBeenCalledWith('usergroups', {
        data: { name: 'Group 1', members: [] },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });

  describe('deleteUserGroup', () => {
    it('should call delete method of usergroups api', async () => {
      const response = await userGroupsAPI.deleteUserGroup(new RequestParams({ _id: 'group1' }));
      expect(api.delete).toHaveBeenCalledWith('usergroups', {
        data: { _id: 'group1' },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });
});
