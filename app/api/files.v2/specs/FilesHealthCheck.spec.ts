import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { FilesHealthCheck } from '../FilesHealthCheck';
import { FileStorage } from '../contracts/FileStorage';
import { DefaultFilesDataSource } from '../database/data_source_defaults';
import { UwaziFile } from '../model/UwaziFile';
import { URLAttachment } from '../model/URLAttachment';
import { CustomUpload } from '../model/CustomUpload';

const factory = getFixturesFactory();

beforeEach(async () => {
  await testingEnvironment.setUp({ files: [] });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

let testStorageFiles: string[] = [];
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
  async list(): Promise<string[]> {
    return testStorageFiles;
  }
}

describe('FilesHealthCheck', () => {
  let filesHealthCheck: FilesHealthCheck;

  beforeEach(() => {
    filesHealthCheck = new FilesHealthCheck(
      new TestFileStorage(),
      DefaultFilesDataSource(DefaultTransactionManager())
    );
  });

  it('should report full count in storage and in db', async () => {
    testStorageFiles = ['document/file1', 'document/file3'];
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
    testStorageFiles = ['document/file1', 'document/file3', 'custom_uploads/custom1'];
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
    testStorageFiles = ['document/file1', 'document/file2', 'document/file3', 'document/file4'];
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
      '/log/1-activity.log',
      '/log/log.log',
      '/log/error.log',
      '/log/debug.log',
      '/document/file1',
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
      '/segmentation/1-activity.log',
      '/documents/segmentation/1-activity.log',
      '/document/file1',
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
      '/documents/index.html',
      '/index.html',
      '/segmentation/index.html',
      '/document/file1',
    ];
    await testingEnvironment.setUp({ files: [] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDbList: ['/document/file1'],
      missingInDb: 1,
    });
  });

  it('should ignore external attachemnts (have url)', async () => {
    testStorageFiles = ['document/file1'];
    await testingEnvironment.setUp({ files: [factory.attachment('url_file', { url: 'url' })] });

    const summary = await filesHealthCheck.execute();

    expect(summary).toMatchObject({
      missingInDb: 1,
      missingInStorage: 0,
    });
  });

  it('should be able to subscribe to an "event" for each file missing in db', async () => {
    testStorageFiles = ['document/file1', 'document/file2'];
    await testingEnvironment.setUp({ files: [] });

    const events: string[] = [];
    filesHealthCheck.onMissingInDB(file => {
      events.push(file);
    });

    await filesHealthCheck.execute();
    expect(events).toEqual(['document/file1', 'document/file2']);
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
