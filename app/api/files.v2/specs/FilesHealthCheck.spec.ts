import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { FilesHealthCheck } from '../FilesHealthCheck';
import { FileStorage } from '../contracts/FileStorage';
import { DefaultFilesDataSource } from '../database/data_source_defaults';
import { UwaziFile } from '../model/UwaziFile';
import { URLAttachment } from '../model/URLAttachment';
import { CustomUpload } from '../model/CustomUpload';
import { StoredFile } from '../model/StoredFile';

const factory = getFixturesFactory();

beforeEach(async () => {
  await testingEnvironment.setUp({ files: [] });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

let testStorageFiles: StoredFile[] = [];
class TestFileStorage implements FileStorage {
  // eslint-disable-next-line class-methods-use-this
  getPath(file: UwaziFile): string {
    if (file instanceof URLAttachment) {
      return '';
    }
    if (file instanceof CustomUpload) {
      return `custom_uploads/${file.filename}`;
    }
    return `document/${file.filename}`;
  }

  // eslint-disable-next-line class-methods-use-this
  async list() {
    return testStorageFiles;
  }
}

let filesHealthCheck: FilesHealthCheck;

describe('FilesHealthCheck', () => {
  beforeEach(() => {
    filesHealthCheck = new FilesHealthCheck(
      new TestFileStorage(),
      DefaultFilesDataSource(DefaultTransactionManager())
    );
  });

  it('should report full count in storage and in db', async () => {
    testStorageFiles = [new StoredFile('document/file1'), new StoredFile('document/file3')];
    await testingEnvironment.setUp({
      files: [factory.document('file1'), factory.document('file2'), factory.document('file4')],
    });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      countInDb: 3,
      countInStorage: 2,
    });
  });

  it('should report missing in storage files', async () => {
    testStorageFiles = [
      new StoredFile('document/file1'),
      new StoredFile('document/file3'),
      new StoredFile('custom_uploads/custom1'),
    ];
    await testingEnvironment.setUp({
      files: [
        factory.document('file1'),
        factory.document('file2'),
        factory.document('file3'),
        factory.document('file4'),
        factory.custom_upload('custom1'),
      ],
    });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInStorageList: ['document/file2', 'document/file4'],
      missingInStorage: 2,
    });
  });

  it('should report missing in DB files', async () => {
    testStorageFiles = [
      new StoredFile('document/file1'),
      new StoredFile('document/file2'),
      new StoredFile('document/file3'),
      new StoredFile('document/file4'),
    ];
    await testingEnvironment.setUp({
      files: [factory.document('file2'), factory.document('file3')],
    });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDbList: ['document/file1', 'document/file4'],
      missingInDb: 2,
    });
  });

  it('should ignore all /log files', async () => {
    testStorageFiles = [
      new StoredFile('/log/1-activity.log'),
      new StoredFile('/log/log.log'),
      new StoredFile('/log/error.log'),
      new StoredFile('/log/debug.log'),
      new StoredFile('/document/file1'),
    ];
    await testingEnvironment.setUp({ files: [] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDbList: ['/document/file1'],
      missingInDb: 1,
    });
  });

  it('should ignore all /segmentation files', async () => {
    testStorageFiles = [
      new StoredFile('/segmentation/1-activity.log'),
      new StoredFile('/documents/segmentation/1-activity.log'),
      new StoredFile('/document/file1'),
    ];
    await testingEnvironment.setUp({ files: [] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDbList: ['/document/file1'],
      missingInDb: 1,
    });
  });

  it('should ignore all index.html files', async () => {
    testStorageFiles = [
      new StoredFile('/documents/index.html'),
      new StoredFile('/index.html'),
      new StoredFile('/segmentation/index.html'),
      new StoredFile('/document/file1'),
    ];
    await testingEnvironment.setUp({ files: [] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDbList: ['/document/file1'],
      missingInDb: 1,
    });
  });

  it('should ignore external attachemnts (have url)', async () => {
    testStorageFiles = [new StoredFile('document/file1')];
    await testingEnvironment.setUp({ files: [factory.attachment('url_file', { url: 'url' })] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDb: 1,
      missingInStorage: 0,
    });
  });

  describe('onMissingInDB', () => {
    it('should emit each file that is missing', async () => {
      testStorageFiles = [new StoredFile('document/file1'), new StoredFile('document/file2')];
      await testingEnvironment.setUp({ files: [] });

      const events: { filename: string }[] = [];
      filesHealthCheck.onMissingInDB(file => {
        events.push(file);
      });

      await filesHealthCheck.execute();
      expect(events.map(e => e.filename)).toEqual(['document/file1', 'document/file2']);
    });

    it('should emit the count of duplicated checksums for each file emited', async () => {
      testStorageFiles = [
        new StoredFile('document/file1', 'checksum1'),
        new StoredFile('document/file2', 'checksum2'),
        new StoredFile('document/file3'),
        new StoredFile('document/file4', 'checksum1'),
        new StoredFile('document/file5', 'checksum1'),
        new StoredFile('document/file6', 'checksum2'),
      ];
      await testingEnvironment.setUp({ files: [] });

      const events: { filename: string }[] = [];
      filesHealthCheck.onMissingInDB(file => {
        events.push(file);
      });

      await filesHealthCheck.execute();
      expect(events).toMatchObject([
        { filename: 'document/file1', checksumMatchCount: 3 },
        { filename: 'document/file2', checksumMatchCount: 2 },
        { filename: 'document/file3', checksumMatchCount: 1 },
        { filename: 'document/file4', checksumMatchCount: 3 },
        { filename: 'document/file5', checksumMatchCount: 3 },
        { filename: 'document/file6', checksumMatchCount: 2 },
      ]);
    });

    it('should emit in the summary the number of files which have a checksum match count > 1', async () => {
      testStorageFiles = [
        new StoredFile('document/file1', 'checksum1'),
        new StoredFile('document/file2', 'checksum2'),
        new StoredFile('document/file3'),
        new StoredFile('document/file4', 'checksum1'),
        new StoredFile('document/file5', 'checksum1'),
        new StoredFile('document/file6', 'checksum2'),
      ];
      await testingEnvironment.setUp({ files: [] });

      const summary = await filesHealthCheck.execute();
      expect(summary).toMatchObject({
        missingInDbWithChecksumMatches: 5,
      });
    });
  });

  it('should be able to subscribe to an "event" for each file missing in storage', async () => {
    testStorageFiles = [];
    await testingEnvironment.setUp({
      files: [factory.document('file1'), factory.document('file2')],
    });

    const events: { _id: string; filename: string }[] = [];
    filesHealthCheck.onMissingInStorage(file => {
      events.push(file);
    });
    await filesHealthCheck.execute();

    expect(events).toEqual([
      { _id: factory.idString('file1'), filename: 'file1' },
      { _id: factory.idString('file2'), filename: 'file2' },
    ]);
  });
});
