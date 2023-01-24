import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration rename-usergroup-members_ref_id', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(40);
  });

  it('should rename the referenced users in groups members list', async () => {
    await migration.up(testingDB.mongodb);
    const membersWithIdCount = await testingDB.mongodb
      .collection('usergroups')
      .countDocuments({ 'members._id': { $exists: true, $ne: null } });
    expect(membersWithIdCount).toBe(0);
    const membersWithRefId = await testingDB.mongodb
      .collection('usergroups')
      .find({ 'members.refId': { $exists: true, $ne: null } })
      .toArray();
    expect(membersWithRefId.length).toBe(2);
    expect(membersWithRefId[0].members[0].refId).toEqual('user1');
    expect(membersWithRefId[1].members[0].refId).toEqual('user1');
    expect(membersWithRefId[1].members[1].refId).toEqual('user2');
  });
});
