import { TestUtils } from 'api/common.v2/utils/Test';
import { Request, Response } from 'express';
import { tenants } from 'api/tenants';
import { BulkDeleteEntityUseCaseFactory } from 'api/core/infrastructure/factories/BulkDeleteEntityUseCaseFactory';
import entities from 'api/entities';
import {
  BulkDeleteEntityController,
  BulkDeleteEntityRequestDto,
} from '../BulkDeleteEntityController';

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
  describe('Given v2 is active', () => {
    const useCaseExecuteSpy: jest.SpyInstance = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      jest.spyOn(tenants, 'current').mockReturnValue({
        featureFlags: { v2BulkDeleteEntity: true },
      } as any);

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

    it('should not call legacy deleteMultiple when v2 is active', async () => {
      const { sut, response } = createSut({
        requestDto: { sharedIds: ['ID_1', 'ID_2'] },
      });

      const entitiesSpy = jest.spyOn(entities, 'deleteMultiple');

      await sut.handleAsync();

      expect(entitiesSpy).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith('ok');
    });
  });
});
