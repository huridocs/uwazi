// eslint-disable-next-line no-restricted-imports
import { access, copyFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { FileCreatedEvent } from '#api/core/domain/files/events/FileCreatedEvent.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { customUploadsPath } from '#api/files/filesystem.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

import { CustomFileUploadFactory } from '../../infrastructure/factories/CustomFileUploadFactory.js';
import { CustomFileUpload } from '../CustomFileUpload.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const createInputFile = async (filename: string) => {
  const testFilePath = path.join(__dirname, '../../../files/specs/test.txt');
  const uniquePath = path.join(tmpdir(), filename);
  await copyFile(testFilePath, uniquePath);
  return new InputFile(
    {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'text/plain',
      destination: path.dirname(uniquePath),
      filename,
      path: uniquePath,
      size: 5,
    },
    'custom'
  );
};

describe('CustomFileUpload', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    let useCase: CustomFileUpload;

    beforeEach(() => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresCore: usePostgres },
      });
      useCase = testingEnvironment.runWithContext(() => CustomFileUploadFactory.default());
    });

    it('should create a custom file upload', async () => {
      const inputFile = await createInputFile('test-custom.txt');

      const result = await useCase.execute({ uploadedFile: inputFile });

      expect(result).toMatchObject({
        type: 'custom',
        originalname: 'test-custom.txt',
        mimetype: 'text/plain',
        size: 5,
        _id: expect.any(String),
      });
    });

    it('should store the file to customUploads directory', async () => {
      const inputFile = await createInputFile('custom-storage-test.txt');

      const result = await useCase.execute({ uploadedFile: inputFile });

      const storedFilePath = customUploadsPath(result.filename!);
      const fileExists = await access(storedFilePath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
    });

    it('should create a database record with correct type', async () => {
      const inputFile = await createInputFile('db-test.txt');

      const result = await useCase.execute({ uploadedFile: inputFile });

      const allFiles = await testingEnvironment.db.getAllFrom('files');
      const savedFile = allFiles.find(f => f._id!.toString() === result._id)!;
      expect(savedFile).toMatchObject({
        type: 'custom',
        originalname: 'db-test.txt',
        mimetype: 'text/plain',
      });
    });

    it('should emit a FileCreatedEvent inside the transaction', async () => {
      const inputFile = await createInputFile('event-test.txt');
      const eventEmitter = EventEmitterFactory.forTesting();
      const emittedWhileRunning: boolean[] = [];

      const result = await testingEnvironment.runWithContext(
        async () => {
          jest.mocked(eventEmitter.emit).mockImplementation(async () => {
            emittedWhileRunning.push(ExecutionContext.transactionManager.isRunning());
          });
          return CustomFileUploadFactory.default().execute({ uploadedFile: inputFile });
        },
        { factories: { eventEmitter: () => eventEmitter } }
      );

      expect(jest.mocked(eventEmitter.emit).mock.calls).toEqual([
        [new FileCreatedEvent({ file: result })],
      ]);
      expect(emittedWhileRunning).toEqual([true]);
    });
  });
});
