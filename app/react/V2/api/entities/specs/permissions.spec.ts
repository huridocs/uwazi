/**
 * @jest-environment node
 */
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { apiClient } from '#V2/api/client.js';
import { getPermissions, savePermissions, searchCollaborators } from '../permissions.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    getJson: jest.fn(),
    putJson: jest.fn(),
    postJson: jest.fn(),
  },
}));

describe('entities permissions api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads granted permissions', async () => {
    const permissions = [
      { refId: 'user1', type: PermissionType.GROUP, level: AccessLevels.READ, label: 'Group' },
    ];
    jest.mocked(apiClient.putJson).mockResolvedValue([permissions]);

    const response = await getPermissions(['shared1', 'shared2']);

    expect(apiClient.putJson).toHaveBeenCalledWith(
      'entities/permissions',
      { sharedIds: ['shared1', 'shared2'] },
      { headers: undefined }
    );
    expect(response).toEqual([permissions]);
  });

  it('saves permissions', async () => {
    const payload = {
      ids: ['shared1', 'shared2'],
      permissions: [{ refId: 'user1', type: PermissionType.GROUP, level: AccessLevels.READ }],
    };
    jest.mocked(apiClient.postJson).mockResolvedValue([payload]);

    const response = await savePermissions(payload);

    expect(apiClient.postJson).toHaveBeenCalledWith('entities/permissions', payload, {
      headers: undefined,
    });
    expect(response).toEqual([payload]);
  });

  it('searches collaborators', async () => {
    const collaborators = [{ refId: 'user1', type: PermissionType.USER, label: 'User' }];
    jest.mocked(apiClient.getJson).mockResolvedValue([collaborators]);

    const response = await searchCollaborators('User');

    expect(apiClient.getJson).toHaveBeenCalledWith(
      'collaborators',
      { filterTerm: 'User' },
      { headers: undefined }
    );
    expect(response).toEqual([collaborators]);
  });
});
