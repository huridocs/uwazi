import testingDB from 'api/utils/testing_db';
import request from 'shared/JSONRequest';
import * as attachmentMethods from 'api/files/filesystem';
import mime from 'mime-types';
import migration from '../index.js';

describe('migration populate-mimetype-on-attachments', () => {
  let headRequestMock;
  let attachmentPathMock;
  let mimeMock;

  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    headRequestMock = spyOn(request, 'head');
    attachmentPathMock = spyOn(attachmentMethods, 'attachmentsPath');
    mimeMock = spyOn(mime, 'lookup');
  });

  afterAll(async () => {
    await testingDB.disconnect();
    headRequestMock.mockRestore();
    attachmentPathMock.mockRestore();
    mimeMock.mockRestore();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(36);
  });

  it('should populate mimetype with Content-Type', async () => {
    const fixtures = {
      files: [{ url: 'some/file/path.jpg' }, { url: 'some/other/path.jpg' }],
    };
    await testingDB.clearAllAndLoad(fixtures);
    const headers = {
      get: jest.fn().mockReturnValueOnce('application/pdf').mockReturnValueOnce('mimetype2'),
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

    const files = await testingDB.mongodb.collection('files').find({}).toArray();

    expect(files[0].mimetype).toEqual('application/pdf');
    expect(files[1].mimetype).toEqual('mimetype2');
  });

  it('should not change the value of mimetype if it already exists in external attachments', async () => {
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

  it('should not change if value of mimetype already exists in internal attachments', async () => {
    const fixturesWithFilenames = {
      files: [
        {
          filename: 'somename.pdf',
          mimetype: 'application/pdf',
          type: 'attachment',
        },
      ],
    };
    await testingDB.clearAllAndLoad(fixturesWithFilenames);
    attachmentPathMock.and.returnValue('/some/path/to/file.pdf');
    mimeMock.and.returnValue('application/pdf');
    await migration.up(testingDB.mongodb);

    const file = await testingDB.mongodb.collection('files').findOne({});
    expect(file.mimetype).toEqual(fixturesWithFilenames.files[0].mimetype);
  });

  it('should update mimetype if filename exists in internal attachments', async () => {
    const fixturesWithFilenames = {
      files: [
        {
          filename: 'somename.pdf',
          type: 'attachment',
        },
      ],
    };
    await testingDB.clearAllAndLoad(fixturesWithFilenames);
    mimeMock.and.returnValue('application/pdf');
    attachmentPathMock.and.returnValue('/some/path/to/file.pdf');
    await migration.up(testingDB.mongodb);

    const file = await testingDB.mongodb.collection('files').findOne({});
    expect(file.mimetype).toEqual('application/pdf');
    expect(attachmentMethods.attachmentsPath).toHaveBeenCalledWith(
      fixturesWithFilenames.files[0].filename
    );
    expect(mime.lookup).toHaveBeenCalledWith('/some/path/to/file.pdf');
  });
  it('should not update mimetype if type is not attachment in internal attachments', async () => {
    const fixturesWithFilenames = {
      files: [
        {
          filename: 'somename.pdf',
          type: 'document',
        },
      ],
    };
    await testingDB.clearAllAndLoad(fixturesWithFilenames);
    mimeMock.and.returnValue('application/pdf');
    attachmentPathMock.and.returnValue('/some/path/to/file.pdf');
    await migration.up(testingDB.mongodb);

    expect(attachmentMethods.attachmentsPath).not.toHaveBeenCalledWith(
      fixturesWithFilenames.files[0].filename
    );
    expect(mime.lookup).not.toHaveBeenCalledWith('/some/path/to/file.pdf');
  });
  it('should not use local attachment if url field is present', async () => {
    const mixedFixtures = {
      files: [
        {
          filename: 'somename.pdf',
          type: 'attachment',
          url: '/some/url/to/file.something',
        },
      ],
    };
    await testingDB.clearAllAndLoad(mixedFixtures);
    const headers = {
      get: jest.fn().mockReturnValueOnce('application/pdf').mockReturnValueOnce('mimetype2'),
    };
    headRequestMock.and.returnValue(
      Promise.resolve({
        headers,
      })
    );
    mimeMock.and.returnValue('application/pdf');
    attachmentPathMock.and.returnValue('/some/path/to/file.pdf');
    await migration.up(testingDB.mongodb);

    expect(attachmentMethods.attachmentsPath).not.toHaveBeenCalled();
    expect(mime.lookup).not.toHaveBeenCalled();
    expect(request.head).toHaveBeenCalledWith(mixedFixtures.files[0].url);
  });
});
