import type { Request, Response } from 'express';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { GrantEntityPermissionsUseCaseFactory } from '#api/core/infrastructure/factories/GrantEntityPermissionsUseCaseFactory.js';
import { BulkGrantEntityPermissionsUseCaseFactory } from '#api/core/infrastructure/factories/BulkGrantEntityPermissionsUseCaseFactory.js';
import {
  EntityPermissionsController,
  EntityPermissionsRequestDto,
} from '../EntityPermissionsController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

type CreateSutProps = {
  requestDto?: Partial<EntityPermissionsRequestDto> | Record<string, unknown>;
};

const createSut = (props?: CreateSutProps) => {
  const request = TestUtils.mockClass<Request>({ body: props?.requestDto ?? {} });
  const response = TestUtils.mockClass<Response>({ json: jest.fn() });

  const sut = new EntityPermissionsController({ request, response });

  ExecutionContext.attachContext(sut, 'handleAsync', {
    factories: {
      logger: () => TestUtils.mockClass<Logger>({ info: jest.fn() }),
    } as any,
  });

  return { sut, request, response };
};

describe('EntityPermissionsController', () => {
  const grantSpy = jest.fn();
  const bulkGrantSpy = jest.fn();

  beforeEach(() => {
    grantSpy.mockResolvedValue(undefined);
    bulkGrantSpy.mockResolvedValue(undefined);

    jest.spyOn(GrantEntityPermissionsUseCaseFactory, 'default').mockReturnValue({
      execute: grantSpy,
    } as any);
    jest.spyOn(BulkGrantEntityPermissionsUseCaseFactory, 'default').mockReturnValue({
      execute: bulkGrantSpy,
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('input validation', () => {
    it('should throw when ids is empty', async () => {
      const { sut } = createSut({ requestDto: { ids: [], permissions: [] } });

      await expect(sut.handleAsync()).rejects.toThrow('At least one entity id is required');
    });

    it('should throw when a single entity request contains a mixed level', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1'],
          permissions: [{ refId: 'user-1', type: 'user', level: 'mixed' }],
        },
      });

      await expect(sut.handleAsync()).rejects.toThrow(
        'Mixed level is not allowed for single entity permissions'
      );
    });
  });

  describe('single entity routing', () => {
    it('should route to GrantEntityPermissions when ids has one entry', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1'],
          permissions: [{ refId: 'user-1', type: 'user', level: 'read' }],
        },
      });

      await sut.handleAsync();

      expect(grantSpy).toHaveBeenCalledTimes(1);
      expect(bulkGrantSpy).not.toHaveBeenCalled();
    });

    it('should pass sharedId as the first element of ids', async () => {
      const { sut } = createSut({
        requestDto: { ids: ['entity-42'], permissions: [] },
      });

      await sut.handleAsync();

      expect(grantSpy).toHaveBeenCalledWith(expect.objectContaining({ sharedId: 'entity-42' }));
    });

    it('should set isPublic to false when no public entry is present', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1'],
          permissions: [{ refId: 'user-1', type: 'user', level: 'read' }],
        },
      });

      await sut.handleAsync();

      expect(grantSpy).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false }));
    });

    it('should set isPublic to true when a public entry is present', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1'],
          permissions: [
            { refId: 'user-1', type: 'user', level: 'write' },
            { refId: 'public', type: 'public', level: 'read' },
          ],
        },
      });

      await sut.handleAsync();

      expect(grantSpy).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true }));
    });

    it('should strip the public entry from the grants passed to the use case', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1'],
          permissions: [
            { refId: 'user-1', type: 'user', level: 'write' },
            { refId: 'public', type: 'public', level: 'read' },
          ],
        },
      });

      await sut.handleAsync();

      expect(grantSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          grants: [{ refId: 'user-1', type: 'user', level: 'write' }],
        })
      );
    });
  });

  describe('bulk routing', () => {
    it('should route to BulkGrantEntityPermissions when ids has more than one entry', async () => {
      const { sut } = createSut({
        requestDto: { ids: ['entity-1', 'entity-2'], permissions: [] },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledTimes(1);
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should set isPublic to undefined when the public entry has mixed level', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2'],
          permissions: [
            { refId: 'user-1', type: 'user', level: 'read' },
            { refId: 'public', type: 'public', level: 'mixed' },
          ],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(expect.objectContaining({ isPublic: undefined }));
    });

    it('should set isPublic to true when the public entry has a non-mixed level', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2'],
          permissions: [{ refId: 'public', type: 'public', level: 'read' }],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true }));
    });

    it('should set isPublic to FALSE when the public entry is not present', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2'],
          permissions: [],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(expect.objectContaining({ isPublic: false }));
    });

    it('should strip mixed non-public grants before calling the bulk use case', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2'],
          permissions: [
            { refId: 'user-1', type: 'user', level: 'write' },
            { refId: 'group-1', type: 'group', level: 'mixed' },
            { refId: 'user-2', type: 'user', level: 'read' },
          ],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          grants: [
            { refId: 'user-1', type: 'user', level: 'write' },
            { refId: 'user-2', type: 'user', level: 'read' },
          ],
        })
      );
    });

    it('should strip the public entry from the grants passed to the bulk use case', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2'],
          permissions: [
            { refId: 'user-1', type: 'user', level: 'write' },
            { refId: 'public', type: 'public', level: 'read' },
          ],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          grants: [{ refId: 'user-1', type: 'user', level: 'write' }],
        })
      );
    });

    it('should pass all sharedIds to the bulk use case', async () => {
      const { sut } = createSut({
        requestDto: {
          ids: ['entity-1', 'entity-2', 'entity-3'],
          permissions: [],
        },
      });

      await sut.handleAsync();

      expect(bulkGrantSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sharedIds: ['entity-1', 'entity-2', 'entity-3'] })
      );
    });
  });

  describe('response', () => {
    it('should return the original request body', async () => {
      const dto = {
        ids: ['entity-1'],
        permissions: [{ refId: 'user-1', type: 'user', level: 'read' }],
      };
      const { sut, response } = createSut({ requestDto: dto });

      await sut.handleAsync();

      expect(response.json).toHaveBeenCalledWith(dto);
    });
  });
});
