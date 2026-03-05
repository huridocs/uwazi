import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { files } from '#api/files/files.js';
import { customUploadsPath } from '#api/files/filesystem.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
// eslint-disable-next-line node/no-restricted-import
import { access } from 'fs/promises';
import path from 'path';
import { CustomFileUploadFactory } from '../../infrastructure/factories/CustomFileUploadFactory.js';
import { CustomFileUpload } from '../CustomFileUpload.js';

const createInputFile = (filename: string) => {
  const testFilePath = path.join(__dirname, '../../../files/specs/test.txt');
  return new InputFile(
    {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'text/plain',
      destination: path.dirname(testFilePath),
      filename: path.basename(testFilePath),
      path: testFilePath,
      size: 5,
    },
    'custom'
  );
};

beforeAll(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('CustomFileUpload', () => {
  let useCase: CustomFileUpload;

  beforeEach(() => {
    useCase = CustomFileUploadFactory.default(TransactionManagerFactory.fake());
  });

  it('should create a custom file upload', async () => {
    const inputFile = createInputFile('test-custom.txt');

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
    const inputFile = createInputFile('custom-storage-test.txt');

    const result = await useCase.execute({ uploadedFile: inputFile });

    const storedFilePath = customUploadsPath(result.filename!);
    const fileExists = await access(storedFilePath)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);
  });

  it('should create a database record with correct type', async () => {
    const inputFile = createInputFile('db-test.txt');

    const result = await useCase.execute({ uploadedFile: inputFile });

    const [savedFile] = await files.get({ _id: result._id });
    expect(savedFile).toMatchObject({
      type: 'custom',
      originalname: 'db-test.txt',
      mimetype: 'text/plain',
    });
  });
});
