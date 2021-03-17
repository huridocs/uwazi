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
    await testingDB.clearAllAndLoad(fixtures);
    const headers = {
      get: jest
        .fn()
        .mockReturnValueOnce('application/pdf')
        .mockReturnValueOnce('mimetype2'),
    };
    headRequestMock.and.returnValue(
      Promise.resolve({
        headers,
      })
    );
    await migration.up(testingDB.mongodb);
    expect(request.head).toHaveBeenCalledWith(fixtures.files[0].url);
    expect(request.head).toHaveBeenCalledWith(fixtures.files[1].url);
    expect(headers.get).toHaveBeenCalledWith('content-type');

    const files = await testingDB.mongodb
      .collection('files')
      .find({})
      .toArray();

    expect(files[0].mimetype).toEqual('application/pdf');
    expect(files[1].mimetype).toEqual('mimetype2');
  });

  it('should not change the value of mimetype if it already exists', async () => {
    const fixturesWithMimetype = {
      files: [
        {
          url: 'some/url/item.jpg',
          mimetype: 'application/pdf',
        },
      ],
    };
    await testingDB.clearAllAndLoad(fixturesWithMimetype);

    const file = await testingDB.mongodb.collection('files').findOne({});

    expect(file.mimetype).toEqual(fixturesWithMimetype.files[0].mimetype);
  });
});
