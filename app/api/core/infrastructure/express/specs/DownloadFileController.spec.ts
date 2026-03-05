import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Request, Response } from 'express';
import { Writable } from 'stream';
import { tenants } from '#api/tenants/index.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { fileDBO } from '#api/core/infrastructure/mongodb/files/schemas/filesTypes.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DownloadFileController } from '../DownloadFileController.js';

type CreateSutProps = {
  filename?: string;
  typesAllowed?: fileDBO['type'][];
  requestAborted?: boolean;
  fileContents?: FileContents;
  fileExists?: boolean;
  user?: any;
  entity?: string;
};

const createFailingFileContents = (error: Error) =>
  new FileContents(async function* fileData() {
    yield new Uint8Array(Buffer.from('partial data'));
    throw error;
  });

const createMockResponse = () => {
  const chunks: Buffer[] = [];

  const writableStream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  (writableStream as any).setHeader = jest.fn();
  (writableStream as any).chunks = chunks;

  return writableStream as any as Response;
};

const createSut = (props?: CreateSutProps) => {
  const filename = props?.filename || 'test.pdf';
  const entity = props?.entity;

  const request = TestUtils.mockClass<Request>({
    params: { filename },
    query: {},
    user: props?.user,
    aborted: props?.requestAborted ?? false,
  });

  const response = createMockResponse();

  const mockFileStorage = TestUtils.mockClass<FileStorage>({
    getFile: jest.fn().mockReturnValue(props?.fileContents),
    fileExists: jest.fn().mockResolvedValue(props?.fileExists ?? true),
  });

  const mockFileData = {
    id: 'file-id',
    filename,
    originalname: filename,
    type: 'document' as const,
    mimetype: 'application/pdf',
    size: 1000,
    creationDate: Date.now(),
    entity,
    isEntityFile: () => Boolean(entity),
  };

  const mockFilesDS = TestUtils.mockClass<any>({
    getByFilename: jest.fn().mockResolvedValue({
      isError: () => false,
      getData: () => mockFileData,
    }),
  });

  const mockPermissionChecker = {
    checkReadPermission: jest.fn().mockResolvedValue({
      getDataOrThrow: () => true,
    }),
  };

  jest.spyOn(FileStorageFactory, 'default').mockReturnValue(mockFileStorage as any);
  jest.spyOn(FilesDataSourceFactory, 'default').mockReturnValue(mockFilesDS);
  jest.spyOn(TransactionManagerFactory, 'default').mockReturnValue({} as any);
  jest.spyOn(tenants, 'current').mockReturnValue({ featureFlags: {} } as any);

  const MongoEntityPermissionChecker =
    require('#api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker').MongoEntityPermissionChecker;
  jest
    .spyOn(MongoEntityPermissionChecker.prototype, 'checkReadPermission')
    .mockImplementation(mockPermissionChecker.checkReadPermission);

  const sut = new DownloadFileController({
    request,
    response,
    typesAllowed: props?.typesAllowed || ['document'],
  });

  return {
    sut,
    request,
    response,
    mockFileStorage,
    mockFilesDS,
    mockPermissionChecker,
  };
};

describe('DownloadFileController', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('pipeline error handling', () => {
    describe('when stream fails with ERR_STREAM_PREMATURE_CLOSE', () => {
      it('should throw OperationalError when request was aborted', async () => {
        const error: any = new Error('Premature close');
        error.code = 'ERR_STREAM_PREMATURE_CLOSE';

        const { sut } = createSut({
          requestAborted: true,
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow(ClientAbortedRequestError);
      });

      it('should re-throw original error when request was NOT aborted', async () => {
        const error: any = new Error('Premature close');
        error.code = 'ERR_STREAM_PREMATURE_CLOSE';

        const { sut } = createSut({
          requestAborted: false,
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow('Premature close');
        await expect(promise).rejects.not.toThrow(ClientAbortedRequestError);

        try {
          await promise;
        } catch (e: any) {
          expect(e.code).toBe('ERR_STREAM_PREMATURE_CLOSE');
        }
      });
    });

    describe('when stream fails with other error types', () => {
      it('should re-throw original error for file system errors', async () => {
        const error: any = new Error('File not found');
        error.code = 'ENOENT';

        const { sut } = createSut({
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow('File not found');
        await expect(promise).rejects.not.toThrow(ClientAbortedRequestError);

        try {
          await promise;
        } catch (e: any) {
          expect(e.code).toBe('ENOENT');
        }
      });

      it('should re-throw original error for permission errors', async () => {
        const error: any = new Error('Permission denied');
        error.code = 'EACCES';

        const { sut } = createSut({
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow('Permission denied');
        await expect(promise).rejects.not.toThrow(ClientAbortedRequestError);

        try {
          await promise;
        } catch (e: any) {
          expect(e.code).toBe('EACCES');
        }
      });

      it('should re-throw original error for generic stream errors', async () => {
        const error = new Error('Generic stream error');

        const { sut } = createSut({
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow('Generic stream error');
        await expect(promise).rejects.not.toThrow(ClientAbortedRequestError);
      });
    });

    describe('edge cases', () => {
      it('should re-throw original error when request is aborted but error code is different', async () => {
        const error: any = new Error('Connection reset');
        error.code = 'ECONNRESET';

        const { sut } = createSut({
          requestAborted: true,
          fileContents: createFailingFileContents(error),
        });

        const promise = sut.handleAsync();

        await expect(promise).rejects.toThrow('Connection reset');
        await expect(promise).rejects.not.toThrow(ClientAbortedRequestError);

        try {
          await promise;
        } catch (e: any) {
          expect(e.code).toBe('ECONNRESET');
        }
      });
    });
  });
});
