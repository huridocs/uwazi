import { getByMemberIdList } from '#api/usergroups/userGroupsMembers.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixtures, group1Id, group2Id, user1Id, user2Id } from './fixtures.js';

describe('userGroupsMembers', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('getByMemberIdList', () => {
    it.each([
      {
        input: [user1Id.toString(), user2Id.toString()],
        outputMatch: [
          { _id: group1Id, name: 'Group 1' },
          { _id: group2Id, name: 'Group 2' },
        ],
      },
    ])(
      'should return the groups that contains the asked member ids',
      async ({ input, outputMatch }) => {
        const groups = await getByMemberIdList(input);
        expect(groups).toMatchObject(outputMatch);
      }
    );
  });
});
