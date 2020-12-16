import { collaborators } from 'api/permissions/collaborators';
import fixtures, { groupA, groupB, userA, userB } from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';
import { PermissionType } from '../../../shared/types/permissionSchema';

describe('collaborators', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('getCollaborators', () => {
    describe('matched user', () => {
      function assertUserAsCollaborator(actualContributor: any, expectedContributor: any) {
        expect(actualContributor).toEqual({
          _id: expectedContributor._id,
          label: expectedContributor.username,
          type: PermissionType.USER,
        });
      }

      it('should return exact insensitive case matched by the username of the user and all existing groups', async () => {
        const availableCollaborators = await collaborators.getCollaborators('userB');
        assertUserAsCollaborator(availableCollaborators[0], userB);
      });

      it('should return exact matched by the email of the user and all existing groups', async () => {
        const availableCollaborators = await collaborators.getCollaborators('usera@domain.org');
        assertUserAsCollaborator(availableCollaborators[0], userA);
      });
    });

    describe('not matched user', () => {
      it('should return all groups that contain the searchTerm', async () => {
        const availableCollaborators = await collaborators.getCollaborators('user1');
        expect(availableCollaborators.length).toBe(1);
        expect(availableCollaborators[0]).toEqual({
          _id: groupB._id.toString(),
          label: groupB.name,
          type: PermissionType.GROUP,
        });
      });

      it('should return all existing groups', async () => {
        const availableCollaborators = await collaborators.getCollaborators('User');
        expect(availableCollaborators[0]).toEqual({
          _id: groupB._id.toString(),
          label: groupB.name,
          type: PermissionType.GROUP,
        });
        expect(availableCollaborators[1]).toEqual({
          _id: groupA._id.toString(),
          label: groupA.name,
          type: PermissionType.GROUP,
        });
      });
    });
  });
});
