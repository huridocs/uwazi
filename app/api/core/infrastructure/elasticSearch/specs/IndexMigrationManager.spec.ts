import type { Client } from '@elastic/elasticsearch';
import { IndexMigrationManager } from '../IndexMigrationManager.js';
import { MigrationValidationError, type IndexDefinition } from '../Types.js';

const makeDefinition = (alias: string, prefix: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: prefix,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const singleAliasBody = (physicalIndex: string): Record<string, unknown> => ({
  [physicalIndex]: { aliases: { products: {} } },
});

const makeClient = ({
  currentPhysical = 'products_v1',
  targetExists = true,
}: {
  currentPhysical?: string;
  targetExists?: boolean;
} = {}): {
  client: Client;
  createMock: jest.Mock;
  reindexMock: jest.Mock;
  updateAliasesMock: jest.Mock;
  deleteMock: jest.Mock;
} => {
  const createMock = jest.fn().mockResolvedValue({});
  const reindexMock = jest.fn().mockResolvedValue({});
  const updateAliasesMock = jest.fn().mockResolvedValue({});
  const deleteMock = jest.fn().mockResolvedValue({});

  const client = {
    indices: {
      getAlias: jest.fn().mockResolvedValue({ body: singleAliasBody(currentPhysical) }),
      create: createMock,
      delete: deleteMock,
      exists: jest.fn().mockResolvedValue({ body: targetExists }),
      updateAliases: updateAliasesMock,
    },
    reindex: reindexMock,
  } as unknown as Client;

  return { client, createMock, reindexMock, updateAliasesMock, deleteMock };
};

describe('IndexMigrationManager', () => {
  const registry = { products: makeDefinition('products', 'products') };

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterAll(() => {
    jest.spyOn(console, 'log').mockRestore();
  });

  describe('migrate()', () => {
    it('throws on unknown index name (not in registry)', async () => {
      const { client } = makeClient();
      const manager = new IndexMigrationManager({ client, registry });

      await expect(manager.migrate({ indexName: 'orders', targetVersion: 2 })).rejects.toThrow(
        'Unknown index "orders"'
      );
    });

    it('no-ops when already on target version', async () => {
      const { client, createMock } = makeClient({ currentPhysical: 'products_v2' });
      const manager = new IndexMigrationManager({ client, registry });

      await manager.migrate({ indexName: 'products', targetVersion: 2 });

      expect(createMock).not.toHaveBeenCalled();
    });

    it('creates new physical index with the format prefix_vN', async () => {
      const { client, createMock } = makeClient({
        currentPhysical: 'products_v1',
      });
      const manager = new IndexMigrationManager({ client, registry });

      await manager.migrate({ indexName: 'products', targetVersion: 2 });

      expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ index: 'products_v2' }));
    });

    it('calls reindex API with correct source and dest', async () => {
      const { client, reindexMock } = makeClient({
        currentPhysical: 'products_v1',
      });
      const manager = new IndexMigrationManager({ client, registry });

      await manager.migrate({ indexName: 'products', targetVersion: 2 });

      // first call is the bulk reindex — no source query
      expect(reindexMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { source: { index: 'products_v1' }, dest: { index: 'products_v2' } },
        })
      );
    });

    describe('delta sync', () => {
      it('delta reindex is called after bulk reindex', async () => {
        const { client, reindexMock } = makeClient({ currentPhysical: 'products_v1' });
        const manager = new IndexMigrationManager({ client, registry });

        await manager.migrate({ indexName: 'products', targetVersion: 2 });

        expect(reindexMock).toHaveBeenCalledTimes(2);
        const firstCall = reindexMock.mock.calls[0][0] as { body: { source: { query?: unknown } } };
        const secondCall = reindexMock.mock.calls[1][0] as {
          body: { source: { query: { range: { updatedAt: { gte: string } } } } };
        };
        expect(firstCall.body.source.query).toBeUndefined();
        expect(secondCall.body.source.query.range.updatedAt.gte).toBeDefined();
      });

      it('delta reindex uses the same source and dest indexes as bulk reindex', async () => {
        const { client, reindexMock } = makeClient({ currentPhysical: 'products_v1' });
        const manager = new IndexMigrationManager({ client, registry });

        await manager.migrate({ indexName: 'products', targetVersion: 2 });

        const secondCall = reindexMock.mock.calls[1][0] as {
          body: { source: { index: string }; dest: { index: string } };
        };
        expect(secondCall.body.source.index).toBe('products_v1');
        expect(secondCall.body.dest.index).toBe('products_v2');
      });

      it('startedAt is captured before first reindex call', async () => {
        const T0 = '2024-01-01T00:00:00.000Z';
        const T1 = '2024-01-01T00:00:05.000Z';
        const spy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(T0);
        const { client, reindexMock } = makeClient({ currentPhysical: 'products_v1' });
        const manager = new IndexMigrationManager({ client, registry });

        reindexMock.mockImplementationOnce(async () => spy.mockReturnValue(T1));
        await manager.migrate({ indexName: 'products', targetVersion: 2 });

        const secondCall = reindexMock.mock.calls[1][0] as {
          body: { source: { query: { range: { updatedAt: { gte: string } } } } };
        };
        // T0 proves startedAt was captured before the first reindex; T1 would mean after
        expect(secondCall.body.source.query.range.updatedAt.gte).toBe(T0);
        spy.mockRestore();
      });

      it('delta reindex respects waitForCompletion option', async () => {
        const { client, reindexMock } = makeClient({ currentPhysical: 'products_v1' });
        const manager = new IndexMigrationManager({ client, registry });

        await manager.migrate({
          indexName: 'products',
          targetVersion: 2,
          waitForCompletion: false,
        });

        const firstCall = reindexMock.mock.calls[0][0] as { wait_for_completion: boolean };
        const secondCall = reindexMock.mock.calls[1][0] as { wait_for_completion: boolean };
        expect(firstCall.wait_for_completion).toBe(false);
        expect(secondCall.wait_for_completion).toBe(false);
      });

      it('validation runs after both reindex passes, not between them', async () => {
        const { client, updateAliasesMock } = makeClient({ currentPhysical: 'products_v1' });
        const manager = new IndexMigrationManager({ client, registry });
        const callOrder: string[] = [];
        const { reindex } = client as unknown as { reindex: jest.Mock };
        reindex.mockImplementation(async () => {
          callOrder.push(`reindex-${callOrder.filter(c => c.startsWith('reindex')).length + 1}`);
        });
        const validate = jest.fn().mockImplementation(async () => {
          callOrder.push('validate');
          return true;
        });
        updateAliasesMock.mockImplementation(async () => {
          callOrder.push('swap');
        });

        await manager.migrate({ indexName: 'products', targetVersion: 2, validate });

        expect(callOrder).toEqual(['reindex-1', 'reindex-2', 'validate', 'swap']);
      });

      it('alias swap does not happen if delta reindex throws', async () => {
        const { client, reindexMock, updateAliasesMock } = makeClient({
          currentPhysical: 'products_v1',
        });
        const manager = new IndexMigrationManager({ client, registry });
        reindexMock
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(new Error('delta reindex failed'));

        await expect(manager.migrate({ indexName: 'products', targetVersion: 2 })).rejects.toThrow(
          'delta reindex failed'
        );

        expect(updateAliasesMock).not.toHaveBeenCalled();
      });
    });

    it('runs validation hook before alias swap', async () => {
      const { client, updateAliasesMock } = makeClient({
        currentPhysical: 'products_v1',
      });
      const manager = new IndexMigrationManager({ client, registry });
      const callOrder: string[] = [];
      const validate = jest.fn().mockImplementation(async () => {
        callOrder.push('validate');
        return true;
      });
      updateAliasesMock.mockImplementation(async () => {
        callOrder.push('swap');
      });

      await manager.migrate({ indexName: 'products', targetVersion: 2, validate });

      expect(callOrder).toEqual(['validate', 'swap']);
    });

    it('aborts and deletes new index if validation returns false', async () => {
      const { client, deleteMock, updateAliasesMock } = makeClient({
        currentPhysical: 'products_v1',
      });
      const manager = new IndexMigrationManager({ client, registry });
      const validate = jest.fn().mockResolvedValue(false);

      await expect(
        manager.migrate({ indexName: 'products', targetVersion: 2, validate })
      ).rejects.toThrow(MigrationValidationError);

      expect(deleteMock).toHaveBeenCalledWith({ index: 'products_v2' });
      expect(updateAliasesMock).not.toHaveBeenCalled();
    });

    it('throws MigrationValidationError on validation failure', async () => {
      const { client } = makeClient({ currentPhysical: 'products_v1' });
      const manager = new IndexMigrationManager({ client, registry });
      const validate = jest.fn().mockResolvedValue(false);

      await expect(
        manager.migrate({ indexName: 'products', targetVersion: 2, validate })
      ).rejects.toBeInstanceOf(MigrationValidationError);
    });

    it('performs atomic alias swap in a single updateAliases call', async () => {
      const { client, updateAliasesMock } = makeClient({
        currentPhysical: 'products_v1',
      });
      const manager = new IndexMigrationManager({ client, registry });

      await manager.migrate({ indexName: 'products', targetVersion: 2 });

      expect(updateAliasesMock).toHaveBeenCalledTimes(1);
      const call = updateAliasesMock.mock.calls[0][0] as {
        body: { actions: { remove?: unknown; add?: unknown }[] };
      };
      const { actions } = call.body;
      expect(actions.some(a => a.remove !== undefined)).toBe(true);
      expect(actions.some(a => a.add !== undefined)).toBe(true);
    });

    it('resolvePhysicalIndex throws if alias points to multiple indexes', async () => {
      const multiBody = {
        products_v1: { aliases: { products: {} } },
        products_v2: { aliases: { products: {} } },
      };
      const client = {
        indices: {
          getAlias: jest.fn().mockResolvedValue({ body: multiBody }),
          create: jest.fn().mockResolvedValue({}),
          exists: jest.fn().mockResolvedValue({ body: true }),
          updateAliases: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        },
        reindex: jest.fn().mockResolvedValue({}),
      } as unknown as Client;
      const manager = new IndexMigrationManager({ client, registry });

      await expect(manager.migrate({ indexName: 'products', targetVersion: 3 })).rejects.toThrow(
        'multiple indexes'
      );
    });
  });

  describe('rollback()', () => {
    it('swaps alias back to specified version', async () => {
      const { client, updateAliasesMock } = makeClient({
        currentPhysical: 'products_v2',
        targetExists: true,
      });
      const manager = new IndexMigrationManager({ client, registry });

      await manager.rollback('products', 1);

      expect(updateAliasesMock).toHaveBeenCalledTimes(1);
      const call = updateAliasesMock.mock.calls[0][0] as {
        body: { actions: { add?: { index: string }; remove?: { index: string } }[] };
      };
      const addAction = call.body.actions.find(a => a.add !== undefined);
      expect(addAction?.add?.index).toBe('products_v1');
    });

    it('throws if target physical index does not exist', async () => {
      const { client } = makeClient({ currentPhysical: 'products_v2', targetExists: false });
      const manager = new IndexMigrationManager({ client, registry });

      await expect(manager.rollback('products', 1)).rejects.toThrow('products_v1');
    });
  });
});
