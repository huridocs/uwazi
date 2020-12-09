import { contributors } from 'api/permissions/contributors';
import fixtures, { groupA, groupB, userA, userB } from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';

describe('contributors', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('getContributors', () => {
    describe('matched user', () => {
      async function getAndAssertContributors(searchTerm: string, expectedUser: any) {
        const availableContributors = await contributors.getContributors(searchTerm);
        expect(availableContributors[0]).toEqual({
          _id: expectedUser._id,
          email: expectedUser.email,
          label: expectedUser.username,
          role: expectedUser.role,
          type: 'user',
        });
        expect(availableContributors[1]).toEqual({
          _id: groupA._id,
          label: groupA.name,
          type: 'group',
        });
        expect(availableContributors[2]).toEqual({
          _id: groupB._id,
          label: groupB.name,
          type: 'group',
        });
      }

      it('should return exact matched by the username of the user and all existing groups', async () => {
        await getAndAssertContributors('UserB', userB);
      });

      it('should return exact matched by the email of the user and all existing groups', async () => {
        await getAndAssertContributors('usera@domain.org', userA);
      });
    });

    describe('not matched user', () => {
      it('should return all existing groups', async () => {
        const availableContributors = await contributors.getContributors('nouser');
        expect(availableContributors[0]).toEqual({
          _id: groupA._id,
          label: groupA.name,
          type: 'group',
        });
        expect(availableContributors[1]).toEqual({
          _id: groupB._id,
          label: groupB.name,
          type: 'group',
        });
      });
    });
  });
});
