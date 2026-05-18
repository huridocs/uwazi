import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Request, Response } from 'express';
import { UpdateFileController } from '../UpdateFileController';
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
    jest
      .spyOn(UpdateFileUseCaseFactory, 'default')
      .mockReturnValue(TestUtils.mockClass<UpdateFile>({ execute: jest.fn() }));

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
    const sut1 = createSut({
      request: { body: { _id: 'file1', language: 'eng' } },
    });

    const sut2 = createSut({
      request: { body: { _id: 'file2', language: 'eng', originalname: 'originalname.txt' } },
    });

    const sut3 = createSut({
      request: { body: { _id: 'file3', originalname: 'originalname.txt' } },
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
  });

  it('should validate request before calling use case', async () => {
    const sut1 = createSut({ request: {} });
    const sut2 = createSut({ request: { body: {} } });
    const sut3 = createSut({ request: { body: { _id: '' } } });
    const sut4 = createSut({ request: { body: { _id: undefined } } });
    const sut5 = createSut({ request: { body: { _id: null } } });
    const sut6 = createSut({ request: { body: { _id: 'file1', language: '', originalname: '' } } });

    expect(sut1.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
    expect(sut2.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
    expect(sut3.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
    expect(sut4.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
    expect(sut5.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
    expect(sut6.sut.handleAsync()).rejects.toThrowErrorMatchingSnapshot();
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
