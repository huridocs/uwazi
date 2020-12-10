import api from 'app/utils/api';
import { searchContributors } from 'app/Permissions/PermissionsAPI';

jest.mock('app/utils/api', () => ({
  get: jest.fn().mockResolvedValue({ json: [{ _id: 'user1' }] }),
  post: jest.fn().mockResolvedValue({ json: { code: 200 } }),
  delete: jest.fn().mockResolvedValue({ json: { code: 200 } }),
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
});
