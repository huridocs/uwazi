import testingDB from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration populate-mimetype-on-attachments', () => {
  let headRequestMock;
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    headRequestMock = spyOn(request, 'head');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    headRequestMock.mockRestore();
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(36);
  });

  it('should populate mimetype with Content-Type', async () => {
    headRequestMock.mockReturnValue(
      Promise.resolve({ headers: { 'Content-Type': 'application/pdf' } })
    );
    await migration.up(testingDB.mongodb);
    expect(request.head).toHaveBeenCalled();
  });
});
