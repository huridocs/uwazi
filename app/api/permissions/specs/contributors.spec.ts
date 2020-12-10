import { contributors } from 'api/permissions/contributors';
import fixtures, { groupA, groupB, userA, userB } from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';

describe('contributors', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('getContributors', () => {
    describe('matched user', () => {
      function assertUserAsContributor(actualContributor: any, expectedContributor: any) {
        expect(actualContributor).toEqual({
          _id: expectedContributor._id,
          email: expectedContributor.email,
          label: expectedContributor.username,
          role: expectedContributor.role,
          type: 'user',
        });
      }

      it('should return exact insensitive case matched by the username of the user and all existing groups', async () => {
        const availableContributors = await contributors.getContributors('userB');
        assertUserAsContributor(availableContributors[0], userB);
      });

      it('should return exact matched by the email of the user and all existing groups', async () => {
        const availableContributors = await contributors.getContributors('usera@domain.org');
        assertUserAsContributor(availableContributors[0], userA);
      });
    });

    describe('not matched user', () => {
      it('should return all groups that contain the searchTerm', async () => {
        const availableContributors = await contributors.getContributors('user1');
        expect(availableContributors.length).toBe(1);
        expect(availableContributors[0]).toEqual({
          _id: groupB._id,
          label: groupB.name,
          type: 'group',
        });
      });

      it('should return all existing groups', async () => {
        const availableContributors = await contributors.getContributors('User');
        expect(availableContributors[0]).toEqual({
          _id: groupB._id,
          label: groupB.name,
          type: 'group',
        });
        expect(availableContributors[1]).toEqual({
          _id: groupA._id,
          label: groupA.name,
          type: 'group',
        });
      });
    });
  });
});
