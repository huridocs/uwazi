import { Request, Response } from 'express';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MutateFileController } from '../MutateFileController.js';
import { CreateFileFromURLUseCaseFactory } from '#api/core/infrastructure/factories/CreateFileFromURLUseCaseFactory.js';
import { UpdateFileUseCaseFactory } from '#api/core/infrastructure/factories/UpdateFileUseCaseFactory.js';
import { CreateFileFromURL } from '#api/core/application/CreateFileFromURL.js';
import { UpdateFile } from '#api/core/application/UpdateFile.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { files } from '#api/files/files.js';
import * as filesRoutes from '#api/files/routes.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

type CreateSutProps = {
  request?: Partial<Request>;
};

const createSut = (props?: CreateSutProps) => {
  const request = TestUtils.mockClass<Request>(props?.request || {});
  const response = TestUtils.mockClass<Response>({
    json: jest.fn(),
  });

  const sut = new MutateFileController({ request, response });

  ExecutionContext.attachContext(sut, 'handleAsync', {
    factories: { logger: LoggerFactory.forTests } as any,
  });

  return { sut, request, response };
};

describe('MutateFileController', () => {
  beforeEach(() => {
    jest.spyOn(CreateFileFromURLUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<CreateFileFromURL>({
        execute: jest
          .fn()
          .mockResolvedValue({ toDTO: jest.fn().mockReturnValue({ _id: 'newFile' }) }),
      })
    );

    jest.spyOn(UpdateFileUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<UpdateFile>({
        execute: jest
          .fn()
          .mockResolvedValue({ toDTO: jest.fn().mockReturnValue({ _id: 'file1' }) }),
      })
    );

    jest.spyOn(files, 'save').mockResolvedValue({ _id: 'file1' } as any);
    jest.spyOn(filesRoutes, 'checkEntityPermission').mockResolvedValue(true);
    jest
      .spyOn(permissionsContext, 'getUserInContext')
      .mockReturnValue({ _id: 'user1', role: 'admin', email: '', username: '' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('when _id is absent', () => {
    it('should delegate to CreateFileFromURL use case when type is attachment', async () => {
      const { sut, response } = createSut({
        request: {
          body: {
            url: 'https://example.com/doc.pdf',
            entity: 'entity1',
            originalname: 'doc.pdf',
            type: 'attachment',
          },
        },
      });

      await sut.handleAsync();

      expect(CreateFileFromURLUseCaseFactory.default().execute).toHaveBeenCalledWith({
        url: 'https://example.com/doc.pdf',
        entityId: 'entity1',
        originalname: 'doc.pdf',
      });
      expect(UpdateFileUseCaseFactory.default().execute).not.toHaveBeenCalled();
      expect(files.save).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({ _id: 'newFile' });
    });

    it('should throw FileTypeNotSupportedError when type is not attachment', async () => {
      const { sut } = createSut({
        request: {
          body: { type: 'document', url: 'https://example.com/doc.pdf' },
        },
      });

      await expect(sut.handleAsync()).rejects.toThrow(
        'The file type is not supported for creation'
      );
    });

    it('should throw FileTypeNotSupportedError when body has no type', async () => {
      const { sut } = createSut({ request: { body: {} } });

      await expect(sut.handleAsync()).rejects.toThrow(
        'The file type is not supported for creation'
      );
    });

    it('should throw FileTypeNotSupportedError when body is missing entirely', async () => {
      const { sut } = createSut({ request: {} });

      await expect(sut.handleAsync()).rejects.toThrow(
        'The file type is not supported for creation'
      );
    });
  });

  describe('when _id is present', () => {
    it('should delegate to UpdateFile use case', async () => {
      const { sut, response } = createSut({
        request: { body: { _id: 'file1', language: 'eng' } },
      });

      await sut.handleAsync();

      expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
        fileId: 'file1',
        language: 'en',
      });
      expect(response.json).toHaveBeenCalledWith({ _id: 'file1' });
    });

    it('should pass originalname and toc to UpdateFile use case', async () => {
      const toc = [
        {
          indentation: 0,
          label: 'Chapter 1',
          selectionRectangles: [{ top: 0, left: 0, width: 100, height: 100 }],
        },
      ];

      const { sut } = createSut({
        request: {
          body: {
            _id: 'file1',
            originalname: 'renamed.txt',
            language: 'spa',
            toc,
          },
        },
      });

      await sut.handleAsync();

      expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
        fileId: 'file1',
        originalname: 'renamed.txt',
        language: 'es',
        toc,
      });
    });

    it('should not call CreateFileFromURL use case', async () => {
      const { sut } = createSut({
        request: { body: { _id: 'file1', originalname: 'new-name.txt' } },
      });

      await sut.handleAsync();

      expect(CreateFileFromURLUseCaseFactory.default().execute).not.toHaveBeenCalled();
    });

    it('should not call files.save legacy path', async () => {
      const { sut } = createSut({
        request: { body: { _id: 'file1' } },
      });

      await sut.handleAsync();

      expect(files.save).not.toHaveBeenCalled();
    });
  });
});
