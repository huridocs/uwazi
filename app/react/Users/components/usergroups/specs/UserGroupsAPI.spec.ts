import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import userGroupsAPI from '../UserGroupsAPI';

jest.mock('app/utils/api', () => ({
  get: jest
    .fn()
    .mockImplementation((_req: RequestParams<UserGroupSchema>) => ({ json: { code: 200 } })),
  post: jest
    .fn()
    .mockImplementation((_req: RequestParams<UserGroupSchema>) => ({ json: { code: 200 } })),
  delete: jest.fn().mockImplementation((_req: RequestParams<{ _id: ObjectIdSchema }>) => ({
    json: { code: 200 },
  })),
}));

describe('UserGroupsAPI', () => {
  beforeEach(() => {});

  describe('getUserGroups', () => {
    it('should call get method of usergroups api', async () => {
      const request = new RequestParams<UserGroupSchema>({ name: 'Group1', members: [] });
      const response = await userGroupsAPI.getUserGroups(request);
      expect(api.get).toHaveBeenCalledWith('usergroups', {
        data: { name: 'Group1', members: [] },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });

  describe('saveUserGroup', () => {
    it('should call post method of usergroups api', async () => {
      const request = new RequestParams<UserGroupSchema>({ name: 'Group1', members: [] });
      const response = await userGroupsAPI.saveUserGroup(request);
      expect(api.post).toHaveBeenCalledWith('usergroups', {
        data: { name: 'Group1', members: [] },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });
});
