import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { BulkDeleteEntityUseCaseFactory } from '#api/core/infrastructure/factories/BulkDeleteEntityUseCaseFactory.js';
import {
  BulkDeleteEntityController,
  BulkDeleteEntityRequestDto,
} from '../BulkDeleteEntityController.js';

type CreateSutProps = {
  requestDto?: BulkDeleteEntityRequestDto;
};

const createSut = (props?: CreateSutProps) => {
  const request = TestUtils.mockClass<Request>({ body: props?.requestDto || {} });
  const response = TestUtils.mockClass<Response>({
    json: jest.fn(),
  });

  const sut = new BulkDeleteEntityController({ request, response });

  return { sut, request, response };
};

describe('BulkDeleteEntityController', () => {
  const useCaseExecuteSpy: jest.SpyInstance = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.spyOn(tenants, 'current').mockReturnValue({} as any);

    jest.spyOn(BulkDeleteEntityUseCaseFactory, 'default').mockReturnValue({
      execute: useCaseExecuteSpy,
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw when given empty sharedIds array', async () => {
    const { sut } = createSut({ requestDto: { sharedIds: [] } });

    await expect(sut.handleAsync()).rejects.toThrow(
      'You must provide at least one sharedId for bulk deletion'
    );
  });

  it('should throw when given more than 1000 sharedIds', async () => {
    const { sut } = createSut({
      requestDto: {
        sharedIds: Array.from({ length: 1001 }, (_, i) => `ID_${i + 1}`),
      },
    });

    await expect(sut.handleAsync()).rejects.toThrow(
      'You must provide at most 1000 sharedIds for bulk deletion'
    );
  });

  it('should deduplicate sharedIds', async () => {
    const { sut } = createSut({
      requestDto: {
        sharedIds: ['ID_1', 'ID_2', 'ID_1', 'ID_3', 'ID_2'],
      },
    });

    await sut.handleAsync();

    expect(useCaseExecuteSpy).toHaveBeenCalledWith({ sharedIds: ['ID_1', 'ID_2', 'ID_3'] });
  });
});
