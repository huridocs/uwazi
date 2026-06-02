import type { Client } from '@elastic/elasticsearch';
import { MigrationScriptRunner } from '../scripts/MigrationScriptRunner.js';
import { IndexMigrationManager } from '../IndexMigrationManager.js';
import {
  MigrationAlreadyOnVersionError,
  MigrationValidationError,
  type IndexDefinition,
} from '../Types.js';

const makeDefinition = (alias: string, prefix: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: prefix,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const registry = {
  products: makeDefinition('products', 'products'),
  orders: makeDefinition('orders', 'orders'),
};

const makeManager = (overrides: Partial<Record<string, jest.Mock>> = {}): IndexMigrationManager => {
  const defaults: Record<string, jest.Mock> = {
    migrate: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v2'),
  };
  return { ...defaults, ...overrides } as unknown as IndexMigrationManager;
};

const makeClient = (aliasBody: Record<string, unknown> = {}): Client =>
  ({
    indices: {
      getAlias: jest.fn().mockResolvedValue({ body: aliasBody }),
    },
  }) as unknown as Client;

describe('MigrationScriptRunner', () => {
  describe('runMigration()', () => {
    it('returns exitCode 1 when indexName not in registry — error includes valid names', async () => {
      const runner = new MigrationScriptRunner({
        manager: makeManager(),
        registry,
        client: makeClient(),
      });

      const result = await runner.runMigration({
        indexName: 'unknown',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('products');
      expect(result.error).toContain('orders');
    });

    it('returns exitCode 0 and does not call manager.migrate() when dryRun is true', async () => {
      const migrateMock = jest.fn();
      const manager = makeManager({ migrate: migrateMock });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 3,
        waitForCompletion: true,
        dryRun: true,
      });

      expect(result.exitCode).toBe(0);
      expect(migrateMock).not.toHaveBeenCalled();
    });

    it('dry run output includes current physical index and target physical index', async () => {
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v2'),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 3,
        waitForCompletion: true,
        dryRun: true,
      });

      expect(result.output).toContain('products_v2');
      expect(result.output).toContain('products_v3');
      expect(result.output).toContain('Dry run');
    });

    it('calls manager.migrate() with correct indexName, targetVersion, and waitForCompletion', async () => {
      const migrateMock = jest.fn().mockResolvedValue(undefined);
      const manager = makeManager({ migrate: migrateMock });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      await runner.runMigration({
        indexName: 'products',
        targetVersion: 5,
        waitForCompletion: false,
        dryRun: false,
      });

      expect(migrateMock).toHaveBeenCalledWith({
        indexName: 'products',
        targetVersion: 5,
        waitForCompletion: false,
      });
    });

    it('returns exitCode 0 with structured output on success', async () => {
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v1'),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('products');
      expect(result.output).toContain('products_v1');
      expect(result.output).toContain('products_v2');
      expect(result.output).toContain('Migration complete');
    });

    it('success output includes duration in ms', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(5821);
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v1'),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.output).toContain('4821ms');
      dateSpy.mockRestore();
    });

    it('returns exitCode 0 with informational message when already on target version', async () => {
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v2'),
        migrate: jest.fn().mockRejectedValue(new MigrationAlreadyOnVersionError('products', 2)),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('already on version 2');
    });

    it('returns exitCode 1 on MigrationValidationError — output includes alias unchanged note', async () => {
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v1'),
        migrate: jest.fn().mockRejectedValue(new MigrationValidationError('products_v2')),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('alias is unchanged');
    });

    it('returns exitCode 1 on unexpected errors — error message is preserved', async () => {
      const manager = makeManager({
        getCurrentPhysicalIndex: jest.fn().mockResolvedValue('products_v1'),
        migrate: jest.fn().mockRejectedValue(new Error('connection refused')),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runMigration({
        indexName: 'products',
        targetVersion: 2,
        waitForCompletion: true,
        dryRun: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('connection refused');
    });
  });

  describe('runRollback()', () => {
    it('returns exitCode 1 when indexName not in registry', async () => {
      const runner = new MigrationScriptRunner({
        manager: makeManager(),
        registry,
        client: makeClient(),
      });

      const result = await runner.runRollback({ indexName: 'nonexistent', toVersion: 1 });

      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('nonexistent');
    });

    it('calls manager.rollback() with correct args', async () => {
      const rollbackMock = jest.fn().mockResolvedValue(undefined);
      const manager = makeManager({ rollback: rollbackMock });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      await runner.runRollback({ indexName: 'products', toVersion: 1 });

      expect(rollbackMock).toHaveBeenCalledWith('products', 1);
    });

    it('returns exitCode 0 with confirmation output on success', async () => {
      const runner = new MigrationScriptRunner({
        manager: makeManager(),
        registry,
        client: makeClient(),
      });

      const result = await runner.runRollback({ indexName: 'products', toVersion: 1 });

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Rollback complete');
      expect(result.output).toContain('products_v1');
    });

    it('returns exitCode 1 when manager throws — error message preserved verbatim', async () => {
      const manager = makeManager({
        rollback: jest.fn().mockRejectedValue(new Error('products_v1" does not exist')),
      });
      const runner = new MigrationScriptRunner({ manager, registry, client: makeClient() });

      const result = await runner.runRollback({ indexName: 'products', toVersion: 1 });

      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('products_v1');
    });
  });

  describe('runList()', () => {
    it('calls getAlias for every index in the registry', async () => {
      const getAliasMock = jest
        .fn()
        .mockResolvedValueOnce({ body: { products_v3: { aliases: { products: {} } } } })
        .mockResolvedValueOnce({ body: { orders_v1: { aliases: { orders: {} } } } });
      const client = { indices: { getAlias: getAliasMock } } as unknown as Client;
      const runner = new MigrationScriptRunner({ manager: makeManager(), registry, client });

      await runner.runList();

      expect(getAliasMock).toHaveBeenCalledTimes(2);
    });

    it('returns formatted output with correct version parsed from physical index name', async () => {
      const getAliasMock = jest
        .fn()
        .mockResolvedValueOnce({ body: { products_v3: { aliases: { products: {} } } } })
        .mockResolvedValueOnce({ body: { orders_v2: { aliases: { orders: {} } } } });
      const client = { indices: { getAlias: getAliasMock } } as unknown as Client;
      const runner = new MigrationScriptRunner({ manager: makeManager(), registry, client });

      const result = await runner.runList();

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('products_v3');
      expect(result.output).toContain('v3');
      expect(result.output).toContain('orders_v2');
      expect(result.output).toContain('v2');
    });

    it('shows "unknown" for a failing entry without aborting the whole list', async () => {
      const getAliasMock = jest
        .fn()
        .mockResolvedValueOnce({ body: { products_v3: { aliases: { products: {} } } } })
        .mockRejectedValueOnce(new Error('index not found'));
      const client = { indices: { getAlias: getAliasMock } } as unknown as Client;
      const runner = new MigrationScriptRunner({ manager: makeManager(), registry, client });

      const result = await runner.runList();

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('products_v3');
      expect(result.output).toContain('unknown');
    });
  });
});
