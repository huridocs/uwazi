/* eslint-disable max-statements */
import { Request, Response } from 'express';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { UpdateFileController } from '../UpdateFileController.js';
import { UpdateFileUseCaseFactory } from '#api/core/infrastructure/factories/UpdateFileUseCaseFactory.js';
import { UpdateFile } from '#api/core/application/UpdateFile.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { files } from '#api/files/files.js';
import * as filesRoutes from '#api/files/routes.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

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
    tenant: { featureFlags: { v2UpdateFile: props?.featureFlag ?? true } } as any,
  });

  return { sut, request, response };
};

describe('UpdateFileController', () => {
  beforeEach(() => {
    jest.spyOn(UpdateFileUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<UpdateFile>({
        execute: jest.fn().mockResolvedValue({ toDTO: jest.fn().mockReturnValue({}) }),
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
  });

  it('should validate request before calling use case', async () => {
    const sutEmptyId = createSut({ request: { body: { _id: '' } } });
    const sutBadOptionals = createSut({
      request: { body: { _id: 'file1', language: '', originalname: '' } },
    });

    await expect(sutEmptyId.sut.handleAsync()).rejects.toThrow();
    await expect(sutBadOptionals.sut.handleAsync()).rejects.toThrow();
  });

  it('should fall back to v1 when _id is null or undefined even with v2 flag enabled', async () => {
    const sutNoBody = createSut({ featureFlag: true, request: {} });
    const sutNoId = createSut({ featureFlag: true, request: { body: {} } });
    const sutUndefinedId = createSut({
      featureFlag: true,
      request: { body: { _id: undefined } },
    });
    const sutNullId = createSut({ featureFlag: true, request: { body: { _id: null } } });
    const sutUrlCreate = createSut({
      featureFlag: true,
      request: {
        body: {
          originalname: 'doc.pdf',
          url: 'https://example.com/doc.pdf',
          entity: 'entity1',
          type: 'attachment',
        },
      },
    });

    for (const sut of [sutNoBody, sutNoId, sutUndefinedId, sutNullId, sutUrlCreate]) {
      jest.clearAllMocks();
      jest.spyOn(files, 'save').mockResolvedValue({ _id: 'file1' } as any);
      jest.spyOn(filesRoutes, 'checkEntityPermission').mockResolvedValue(true);

      // eslint-disable-next-line no-await-in-loop
      await sut.sut.handleAsync();

      expect(files.save).toHaveBeenCalled();
      expect(UpdateFileUseCaseFactory.default).not.toHaveBeenCalled();
    }
  });

  it('should execute v1 use case when feature flag is off', async () => {
    const sut1 = createSut({ featureFlag: false, request: { body: { _id: 'file1' } } });
    const sut2 = createSut({ request: { body: { _id: 'file2' } } });

    await sut1.sut.handleAsync();
    expect(files.save).toHaveBeenCalledWith({ _id: 'file1' });
    expect(sut1.response.json).toHaveBeenCalled();

    expect(UpdateFileUseCaseFactory.default).not.toHaveBeenCalled();
    expect(sut2.response.json).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await sut2.sut.handleAsync();
    expect(files.save).not.toHaveBeenCalled();
    expect(sut1.response.json).not.toHaveBeenCalled();

    expect(UpdateFileUseCaseFactory.default).toHaveBeenCalled();
    expect(sut2.response.json).toHaveBeenCalled();
  });
});
