/* eslint-disable max-statements */
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { UpdateFileController } from '../UpdateFileController.js';
import { UpdateFileUseCaseFactory } from '#api/core/infrastructure/factories/UpdateFileUseCaseFactory.js';
import { UpdateFile } from '#api/core/application/UpdateFile.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { files } from '#api/files/files.js';
import * as filesRoutes from '#api/files/routes.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';

type CreateSutProps = {
  request?: Partial<Request>;
  featureFlag?: boolean;
};

const createSut = (props?: CreateSutProps) => {
  const request = TestUtils.mockClass<Request>(props?.request || {});
  const response = TestUtils.mockClass<Response>({
    json: jest.fn(),
  });

  const sut = new UpdateFileController({ request, response });

  ExecutionContext.attachContext(sut, 'handleAsync', {
    factories: { logger: LoggerFactory.forTests } as any,
  });

  return { sut, request, response };
};

describe('UpdateFileController', () => {
  const file = FileBuilder.processedDocument(new ObjectId().toString());

  beforeEach(() => {
    jest.spyOn(UpdateFileUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<UpdateFile>({
        execute: jest.fn().mockResolvedValue(file),
      })
    );

    jest.spyOn(files, 'save').mockReturnValue(Promise.resolve({ _id: 'file1' } as any));

    jest.spyOn(filesRoutes, 'checkEntityPermission').mockResolvedValue(true);
    jest
      .spyOn(permissionsContext, 'getUserInContext')
      .mockReturnValue({ _id: 'user1', role: 'admin', email: '', username: '' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call use case with correct input and return http response', async () => {
    const toc = [
      {
        indentation: 0,
        label: 'Chapter 1',
        selectionRectangles: [{ top: 0, left: 0, width: 100, height: 100 }],
      },
    ];

    const sut1 = createSut({
      request: { body: { _id: 'file1', language: 'eng' } },
    });

    const sut2 = createSut({
      request: { body: { _id: 'file2', language: 'eng', originalname: 'originalname.txt' } },
    });

    const sut3 = createSut({
      request: { body: { _id: 'file3', originalname: 'originalname.txt' } },
    });

    const sut4 = createSut({
      request: { body: { _id: 'file4', toc } },
    });

    const sut5 = createSut({
      request: { body: { _id: 'file5', url: 'http://example.com' } },
    });

    await sut1.sut.handleAsync();
    expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
      fileId: 'file1',
      language: 'en',
    });

    await sut2.sut.handleAsync();
    expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
      fileId: 'file2',
      language: 'en',
      originalname: 'originalname.txt',
    });

    await sut3.sut.handleAsync();
    expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
      fileId: 'file3',
      originalname: 'originalname.txt',
    });

    await sut4.sut.handleAsync();
    expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
      fileId: 'file4',
      toc,
    });

    await sut5.sut.handleAsync();
    expect(UpdateFileUseCaseFactory.default().execute).toHaveBeenCalledWith({
      fileId: 'file5',
      url: 'http://example.com',
    });
  });

  it('should validate request before calling use case', async () => {
    const sutEmptyId = createSut({ request: { body: { _id: '' } } });
    const sutBadOptionals = createSut({
      request: { body: { _id: 'file1', language: '', originalname: '' } },
    });
    const sutBadUrl = createSut({
      request: { body: { _id: 'file1', url: '' } },
    });

    await expect(sutEmptyId.sut.handleAsync()).rejects.toMatchSnapshot();
    await expect(sutBadOptionals.sut.handleAsync()).rejects.toMatchSnapshot();
    await expect(sutBadUrl.sut.handleAsync()).rejects.toMatchSnapshot();
  });
});
