import api from 'app/utils/api';
import {
  loadGrantedPermissions,
  savePermissions,
  searchCollaborators,
} from 'app/Permissions/PermissionsAPI';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';

jest.mock('app/utils/api', () => ({
  get: jest.fn().mockResolvedValue({ json: [{ _id: 'user1' }] }),
  post: jest.fn().mockResolvedValue({ json: { code: 200 } }),
}));

describe('PermissionsAPI', () => {
  describe('searchCollaborators', () => {
    it('should call get method of collaborators api', async () => {
      const response = await searchCollaborators('User');
      expect(api.get).toHaveBeenCalledWith('collaborators', {
        data: { filterTerm: 'User' },
        headers: {},
      });
      expect(response).toEqual([{ _id: 'user1' }]);
    });
  });

  describe('loadGrantedPermissions', () => {
    it('should call get method of entities/permissions collaborators api', async () => {
      const response = await loadGrantedPermissions(['shared1', 'shared2']);
      expect(api.get).toHaveBeenCalledWith('entities/permissions', {
        data: { ids: ['shared1', 'shared2'] },
        headers: {},
      });
      expect(response).toEqual([{ _id: 'user1' }]);
    });
  });

  describe('savePermissions', () => {
    it('should call post method of entities/permissions collaborators api', async () => {
      const ids = ['shared1', 'shared2'];
      const permissions = [{ _id: 'user1', type: PermissionType.GROUP, level: AccessLevels.READ }];
      const response = await savePermissions(ids, permissions);
      expect(api.post).toHaveBeenCalledWith('entities/permissions', {
        data: { ids, permissions },
        headers: {},
      });
      expect(response.code).toBe(200);
    });
  });
});
