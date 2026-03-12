import type { Client } from '@elastic/elasticsearch';
import { GroupAliasNameBuilder } from '../provision/GroupAliasNameBuilder.js';
import { TenantProvisioningService } from '../provision/TenantProvisioningService.js';
import {
  GroupAlreadyExistsError,
  GroupNotFoundError,
  TenantAlreadyInGroupError,
} from '../Types.js';
import type { IndexDefinition } from '../Types.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { TenantRoutingDataSource } from '../TenantRoutingDataSource.js';

const registry: Record<string, IndexDefinition> = {
  products: {
    alias: 'products',
    physicalPrefix: 'products',
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  } as unknown as IndexDefinition,
};

const makeEsClient = (existsAliasResult: boolean) => {
  const createMock = jest.fn().mockResolvedValue({});
  const reindexMock = jest.fn().mockResolvedValue({ body: { total: 100 } });
  const deleteByQueryMock = jest.fn().mockResolvedValue({});
  const esClient = {
    indices: {
      existsAlias: jest.fn().mockResolvedValue({ body: existsAliasResult }),
      create: createMock,
    },
    reindex: reindexMock,
    deleteByQuery: deleteByQueryMock,
  } as unknown as Client;
  return { esClient, createMock, reindexMock, deleteByQueryMock };
};

const makeResources = ({
  existsAliasResult = false,
  resolverReturns = 'products',
}: {
  existsAliasResult?: boolean;
  resolverReturns?: string;
} = {}) => {
  const { esClient, createMock, reindexMock, deleteByQueryMock } = makeEsClient(existsAliasResult);
  const upsertRoute = jest.fn().mockResolvedValue(undefined);
  const routingRepository: TenantRoutingDataSource = {
    findRoute: jest.fn(),
    upsertRoute,
    deleteRoute: jest.fn(),
  };
  const invalidate = jest.fn();
  // Todo: fix typing here.

  //@ts-ignore
  const resolver: IndexNameResolver = {
    resolve: jest.fn().mockResolvedValue(resolverReturns),
    invalidate,
  };
  const sut = new TenantProvisioningService({ esClient, registry, routingRepository, resolver });
  return {
    sut,
    esClient,
    createMock,
    reindexMock,
    deleteByQueryMock,
    upsertRoute,
    invalidate,
    resolver,
  };
};

describe('TenantProvisioningService', () => {
  describe('createGroup()', () => {
    it('throws on unknown aliasName in registry', async () => {
      const { sut } = makeResources();
      await expect(sut.createGroup('enterprise', 'invoices')).rejects.toThrow(
        'Unknown logical index "invoices"'
      );
    });

    it('throws GroupAlreadyExistsError when alias already exists', async () => {
      const { sut } = makeResources({ existsAliasResult: true });
      await expect(sut.createGroup('enterprise', 'products')).rejects.toBeInstanceOf(
        GroupAlreadyExistsError
      );
    });

    it('creates physical index with correct name from GroupAliasNameBuilder', async () => {
      const { sut, createMock } = makeResources();
      await sut.createGroup('enterprise', 'products');
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'products_group_enterprise_v1' })
      );
    });

    it('uses mappings and settings from registry (not hardcoded)', async () => {
      const { sut, createMock } = makeResources();
      await sut.createGroup('enterprise', 'products');
      const call = createMock.mock.calls[0][0] as {
        body: { mappings: unknown; settings: unknown };
      };
      expect(call.body.mappings).toEqual(registry.products.mappings);
      expect(call.body.settings).toEqual(registry.products.settings);
    });

    it('creates alias pointing to physical index in the same create call', async () => {
      const { sut, createMock } = makeResources();
      await sut.createGroup('enterprise', 'products');
      const call = createMock.mock.calls[0][0] as { body: { aliases: Record<string, unknown> } };
      expect(call.body.aliases).toHaveProperty('products_group_enterprise');
    });

    it('does not write any routing record', async () => {
      const { sut, upsertRoute } = makeResources();
      await sut.createGroup('enterprise', 'products');
      expect(upsertRoute).not.toHaveBeenCalled();
    });

    it('returns ProvisioningResult with success: true', async () => {
      const { sut } = makeResources();
      const result = await sut.createGroup('enterprise', 'products');
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create-group');
    });
  });

  describe('assignTenant()', () => {
    describe('error guards', () => {
      it('throws on unknown aliasName in registry', async () => {
        const { sut } = makeResources({ existsAliasResult: true });
        await expect(sut.assignTenant('bigcorp', 'invoices', 'enterprise')).rejects.toThrow(
          'Unknown logical index "invoices"'
        );
      });

      it('throws GroupNotFoundError when target alias does not exist', async () => {
        const { sut } = makeResources({ existsAliasResult: false });
        await expect(sut.assignTenant('bigcorp', 'products', 'enterprise')).rejects.toBeInstanceOf(
          GroupNotFoundError
        );
      });

      it('throws TenantAlreadyInGroupError when tenant is already on target alias', async () => {
        const targetAlias = GroupAliasNameBuilder.toAlias('enterprise', 'products');
        const { sut } = makeResources({ existsAliasResult: true, resolverReturns: targetAlias });
        await expect(sut.assignTenant('bigcorp', 'products', 'enterprise')).rejects.toBeInstanceOf(
          TenantAlreadyInGroupError
        );
      });

      it('does not call deleteByQuery when tenant is already on the target alias', async () => {
        const targetAlias = GroupAliasNameBuilder.toAlias('enterprise', 'products');
        const { sut, deleteByQueryMock } = makeResources({
          existsAliasResult: true,
          resolverReturns: targetAlias,
        });
        await expect(sut.assignTenant('bigcorp', 'products', 'enterprise')).rejects.toBeInstanceOf(
          TenantAlreadyInGroupError
        );
        expect(deleteByQueryMock).not.toHaveBeenCalled();
      });
    });

    describe('reindex flow', () => {
      it('calls reindex with correct source (filtered by tenantId) and dest', async () => {
        const { sut, reindexMock } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        const firstCall = reindexMock.mock.calls[0][0];
        expect(firstCall.body.source.index).toBe('products');
        expect(firstCall.body.source.query).toEqual({ term: { tenantId: 'bigcorp' } });
        expect(firstCall.body.dest.index).toBe('products_group_enterprise');
        expect(firstCall.body.dest.pipeline).toBe('none');
      });

      it('calls delta sync reindex after first reindex completes', async () => {
        const { sut, reindexMock } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(reindexMock).toHaveBeenCalledTimes(2);
      });

      it('delta sync uses updatedAt >= reindexStartedAt range query', async () => {
        const fixedDate = '2024-06-01T12:00:00.000Z';
        const spy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(fixedDate);
        const { sut, reindexMock } = makeResources({ existsAliasResult: true });

        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        spy.mockRestore();

        const deltaCall = reindexMock.mock.calls[1][0];
        expect(deltaCall.body.source.query.bool.must).toEqual(
          expect.arrayContaining([{ range: { updatedAt: { gte: fixedDate } } }])
        );
      });

      it('delta sync also filters by tenantId', async () => {
        const { sut, reindexMock } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        const deltaCall = reindexMock.mock.calls[1][0];
        expect(deltaCall.body.source.query.bool.must).toEqual(
          expect.arrayContaining([{ term: { tenantId: 'bigcorp' } }])
        );
      });

      it('propagates ES error during reindex — does not swallow', async () => {
        const { sut, esClient } = makeResources({ existsAliasResult: true });
        (esClient.reindex as jest.Mock).mockRejectedValueOnce(new Error('ES reindex failed'));
        await expect(sut.assignTenant('bigcorp', 'products', 'enterprise')).rejects.toThrow(
          'ES reindex failed'
        );
      });

      describe('pipeline bypass', () => {
        it("bulk reindex includes pipeline: 'none' to bypass ingest pipeline", async () => {
          const { sut, reindexMock } = makeResources({ existsAliasResult: true });
          await sut.assignTenant('bigcorp', 'products', 'enterprise');
          const firstCall = reindexMock.mock.calls[0][0];
          expect(firstCall.body.dest.pipeline).toBe('none');
        });

        it("delta reindex includes pipeline: 'none' to bypass ingest pipeline", async () => {
          const { sut, reindexMock } = makeResources({ existsAliasResult: true });
          await sut.assignTenant('bigcorp', 'products', 'enterprise');
          const deltaCall = reindexMock.mock.calls[1][0];
          expect(deltaCall.body.dest.pipeline).toBe('none');
        });

        it('delta reindex query filters by both tenantId AND updatedAt >= reindexStartedAt', async () => {
          const fixedDate = '2024-06-01T12:00:00.000Z';
          const spy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(fixedDate);
          const { sut, reindexMock } = makeResources({ existsAliasResult: true });

          await sut.assignTenant('bigcorp', 'products', 'enterprise');
          spy.mockRestore();

          const deltaCall = reindexMock.mock.calls[1][0];
          const mustArray = deltaCall.body.source.query.bool.must;
          expect(mustArray).toHaveLength(2);
          expect(mustArray).toEqual(
            expect.arrayContaining([
              { term: { tenantId: 'bigcorp' } },
              { range: { updatedAt: { gte: fixedDate } } },
            ])
          );
        });
      });
    });

    describe('routing commit and result', () => {
      it('calls routingRepository.upsertRoute with correct record', async () => {
        const { sut, upsertRoute } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(upsertRoute).toHaveBeenCalledWith({
          tenantId: 'bigcorp',
          aliasName: 'products',
          resolvedAlias: 'products_group_enterprise',
          groupName: 'enterprise',
        });
      });

      it('calls resolver.invalidate with correct tenantId and aliasName', async () => {
        const { sut, invalidate } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(invalidate).toHaveBeenCalledWith('bigcorp', 'products');
      });

      it('calls resolver.invalidate AFTER routingRepository.upsertRoute', async () => {
        const callOrder: string[] = [];
        const { sut, upsertRoute, invalidate } = makeResources({ existsAliasResult: true });
        (upsertRoute as jest.Mock).mockImplementation(async () => {
          callOrder.push('upsertRoute');
        });
        (invalidate as jest.Mock).mockImplementation(() => {
          callOrder.push('invalidate');
        });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(callOrder.indexOf('upsertRoute')).toBeLessThan(callOrder.indexOf('invalidate'));
      });

      it('calls deleteByQuery on source index for tenant documents', async () => {
        const { sut, deleteByQueryMock } = makeResources({ existsAliasResult: true });
        await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(deleteByQueryMock).toHaveBeenCalledWith(
          expect.objectContaining({
            index: 'products',
            body: { query: { term: { tenantId: 'bigcorp' } } },
          })
        );
      });

      it('returns ProvisioningResult with success: true', async () => {
        const { sut } = makeResources({ existsAliasResult: true });
        const result = await sut.assignTenant('bigcorp', 'products', 'enterprise');
        expect(result.success).toBe(true);
        expect(result.operation).toBe('assign-tenant');
      });
    });
  });
});
