import { testingDB } from 'api/utils/testing_db';
import { fixtures, groupA, groupB, userA, userB } from 'api/permissions/specs/fixtures';
import { collaborators } from 'api/permissions/collaborators';
import { PermissionType } from 'shared/types/permissionSchema';
import { UserInContextMockFactory } from '../../utils/testingUserInContext';
import { PUBLIC_PERMISSION } from '../publicPermission';

describe('collaborators', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('search', () => {
    function assertPublicOption(results: any[]) {
      expect(results).toEqual(expect.arrayContaining([PUBLIC_PERMISSION]));
    }

    describe('matched user', () => {
      function assertUserAsCollaborator(actualContributor: any, expectedContributor: any) {
        expect(actualContributor).toEqual({
          refId: expectedContributor._id,
          label: expectedContributor.username,
          type: PermissionType.USER,
        });
      }

      it('should return exact insensitive case matched by the username', async () => {
        const availableCollaborators = await collaborators.search('userB');
        assertUserAsCollaborator(availableCollaborators[0], userB);
        assertPublicOption(availableCollaborators);
      });

      it('should return exact matched by the email of the user', async () => {
        const availableCollaborators = await collaborators.search('usera@domain.org');
        assertUserAsCollaborator(availableCollaborators[0], userA);
        assertPublicOption(availableCollaborators);
      });
    });

    describe('not matched user', () => {
      it('should return all groups that start with the searchTerm', async () => {
        const availableCollaborators = await collaborators.search('user1');
        expect(availableCollaborators.length).toBe(2);
        expect(availableCollaborators[0]).toEqual({
          refId: groupB._id.toString(),
          label: groupB.name,
          type: PermissionType.GROUP,
        });
        assertPublicOption(availableCollaborators);
      });

      it('should return all existing groups', async () => {
        const availableCollaborators = (await collaborators.search('User')).sort((a, b) =>
          a.refId.toString().localeCompare(b.refId.toString())
        );

        expect(availableCollaborators[0]).toEqual({
          refId: groupA._id.toString(),
          label: groupA.name,
          type: PermissionType.GROUP,
        });
        expect(availableCollaborators[1]).toEqual({
          refId: groupB._id.toString(),
          label: groupB.name,
          type: PermissionType.GROUP,
        });
        assertPublicOption(availableCollaborators);
      });
    });

    it('should not include "public" if user is collaborator', async () => {
      new UserInContextMockFactory().mock({
        _id: 'collab',
        role: 'collaborator',
        email: 'collab',
        username: 'collab',
      });

      expect(await collaborators.search('User')).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: PermissionType.PUBLIC,
          }),
        ])
      );
    });
  });
});
