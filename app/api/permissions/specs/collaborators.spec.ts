// @ts-expect-error TS(2307): Cannot find module '../permissions/collaborators.j... Remove this comment to see the full error message
import { collaborators } from '../permissions/collaborators.js';
// @ts-expect-error TS(2307): Cannot find module '../permissions/specs/fixtures.... Remove this comment to see the full error message
import { fixtures, groupA, groupB, userA, userB } from '../permissions/specs/fixtures.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/permissionS... Remove this comment to see the full error message
import { PermissionType } from 'shared/types/permissionSchema.js';
import { UserInContextMockFactory } from '../../utils/testingUserInContext';
import { PUBLIC_PERMISSION } from '../publicPermission';

describe('collaborators', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
        // @ts-expect-error TS(7006): Parameter 'a' implicitly has an 'any' type.
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
