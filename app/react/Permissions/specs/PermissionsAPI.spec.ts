import api from 'app/utils/api';
import {
  loadGrantedPermissions,
  savePermissions,
  searchContributors,
} from 'app/Permissions/PermissionsAPI';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';

jest.mock('app/utils/api', () => ({
  get: jest.fn().mockResolvedValue({ json: [{ _id: 'user1' }] }),
  post: jest.fn().mockResolvedValue({ json: { code: 200 } }),
}));

describe('PermissionsAPI', () => {
  describe('searchContributors', () => {
    it('should call get method of constributors api', async () => {
      const response = await searchContributors('User');
      expect(api.get).toHaveBeenCalledWith('contributors', {
        data: { filterTerm: 'User' },
        headers: {},
      });
      expect(response).toEqual([{ _id: 'user1' }]);
    });
  });

  describe('loadGrantedPermissions', () => {
    it('should call get method of entities/permissions constributors api', async () => {
      const response = await loadGrantedPermissions(['shared1', 'shared2']);
      expect(api.get).toHaveBeenCalledWith('entities/permissions', {
        data: { ids: ['shared1', 'shared2'] },
        headers: {},
      });
      expect(response).toEqual([{ _id: 'user1' }]);
    });
  });

  describe('savePermissions', () => {
    it('should call post method of entities/permissions constributors api', async () => {
      const ids = ['shared1', 'shared2'];
      const permissions = [{ _id: 'user1', type: PermissionType.GROUP, level: AccessLevels.MIXED }];
      const response = await savePermissions(ids, permissions);
      expect(api.post).toHaveBeenCalledWith('entities/permissions', {
        data: { ids, permissions },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });
});
