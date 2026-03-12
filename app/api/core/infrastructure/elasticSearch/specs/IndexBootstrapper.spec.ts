/* eslint-disable max-statements */
import { Client } from '@elastic/elasticsearch';
import { IndexBootstrapper } from '../provision/IndexBootstrapper.js';
import type { IndexDefinition } from '../Types.js';

const client = new Client({ node: 'http://localhost:9200' });

const runId = Date.now();
let counter = 0;
// eslint-disable-next-line no-plusplus
const uniqueAlias = () => `test_bootstrapper_${runId}_${counter++}`;

const makeDefinition = (alias: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: alias,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const deletePhysicalIndex = async (physicalIndex: string) => {
  await client.indices.delete({ index: physicalIndex }).catch(() => {
    /* already gone – ignore */
  });
};

describe('IndexBootstrapper', () => {
  let logSpy: jest.SpyInstance;
  const created: string[] = [];

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    while (created.length) {
      // eslint-disable-next-line no-await-in-loop
      await deletePhysicalIndex(`${created.pop()}_v1`);
    }
  });

  it('skips creation when alias already exists', async () => {
    const alias = uniqueAlias();
    created.push(alias);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    // first call creates it
    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));
    // second call should be a no-op (alias now exists)
    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));

    const { body } = await client.indices.getAlias({ name: alias });
    const physicalIndices = Object.keys(body);
    expect(physicalIndices).toHaveLength(1);
    expect(physicalIndices[0]).toBe(`${alias}_v1`);
  });

  it('creates physical index with _v1 suffix when alias does not exist', async () => {
    const alias = uniqueAlias();
    created.push(alias);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));

    const { body } = await client.indices.exists({ index: `${alias}_v1` });
    expect(body).toBe(true);
  });

  it('alias is created pointing to the physical index in the same call', async () => {
    const alias = uniqueAlias();
    created.push(alias);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));

    const { body } = await client.indices.getAlias({ name: alias });
    const physicalIndex = Object.keys(body)[0];
    expect(physicalIndex).toBe(`${alias}_v1`);
    expect(body[physicalIndex].aliases).toHaveProperty(alias);
  });

  it('bootstrapAll() creates an index for each entry in the registry', async () => {
    const aliasA = uniqueAlias();
    const aliasB = uniqueAlias();
    created.push(aliasA, aliasB);
    const registry = {
      a: makeDefinition(aliasA),
      b: makeDefinition(aliasB),
    };
    const bootstrapper = new IndexBootstrapper({ client, registry });

    await bootstrapper.bootstrapAll();

    const [{ body: bodyA }, { body: bodyB }] = await Promise.all([
      client.indices.exists({ index: `${aliasA}_v1` }),
      client.indices.exists({ index: `${aliasB}_v1` }),
    ]);
    expect(bodyA).toBe(true);
    expect(bodyB).toBe(true);
  });

  it('logs a skip message when alias already exists', async () => {
    const alias = uniqueAlias();
    created.push(alias);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));
    await bootstrapper.bootstrapOne(alias, makeDefinition(alias));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(alias));
  });

  it('does not throw on a registry with zero entries', async () => {
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });
    await expect(bootstrapper.bootstrapAll()).resolves.not.toThrow();
  });

  describe('race condition: resource_already_exists_exception', () => {
    it('does not throw when a concurrent instance already created the physical index', async () => {
      const alias = uniqueAlias();
      created.push(alias);
      const bootstrapper = new IndexBootstrapper({ client, registry: {} });

      // Simulate the other backend instance having created the physical index
      // just before us, but WITHOUT the alias (so existsAlias returns false).
      await client.indices.create({
        index: `${alias}_v1`,
        body: { settings: { number_of_shards: 1 } },
      });

      // Our instance sees no alias → tries to create → resource_already_exists_exception
      await expect(bootstrapper.bootstrapOne(alias, makeDefinition(alias))).resolves.not.toThrow();
    });

    it('logs a message when swallowing the race-condition error', async () => {
      const alias = uniqueAlias();
      created.push(alias);
      const bootstrapper = new IndexBootstrapper({ client, registry: {} });

      await client.indices.create({
        index: `${alias}_v1`,
        body: { settings: { number_of_shards: 1 } },
      });

      await bootstrapper.bootstrapOne(alias, makeDefinition(alias));

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(alias));
    });

    it('still throws for unrelated ES errors', async () => {
      const alias = uniqueAlias();
      // deliberately bad mapping to trigger a different ES error
      const badDefinition = {
        alias,
        physicalPrefix: alias,
        settings: { number_of_shards: 1 },
        mappings: { properties: { id: { type: 'not_a_real_type' } } },
      } as unknown as IndexDefinition;
      const bootstrapper = new IndexBootstrapper({ client, registry: {} });

      await expect(bootstrapper.bootstrapOne(alias, badDefinition)).rejects.toThrow();
    });
  });
});
