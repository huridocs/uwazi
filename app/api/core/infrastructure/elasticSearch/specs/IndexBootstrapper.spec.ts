import type { Client } from '@elastic/elasticsearch';
import { IndexBootstrapper } from '../provision/IndexBootstrapper.js';
import type { IndexDefinition } from '../Types.js';

const makeDefinition = (alias: string, prefix: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: prefix,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const makeClient = (existsAliasResult: boolean): { client: Client; createMock: jest.Mock } => {
  const createMock = jest.fn().mockResolvedValue({});
  const client = {
    indices: {
      existsAlias: jest.fn().mockResolvedValue({ body: existsAliasResult }),
      create: createMock,
    },
  } as unknown as Client;
  return { client, createMock };
};

describe('IndexBootstrapper', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('skips creation when alias already exists', async () => {
    const { client, createMock } = makeClient(true);
    const bootstrapper = new IndexBootstrapper({
      client,
      registry: {
        products: makeDefinition('products', 'products'),
      },
    });

    await bootstrapper.bootstrapOne('products', makeDefinition('products', 'products'));

    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates physical index with _v1 suffix when alias does not exist', async () => {
    const { client, createMock } = makeClient(false);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne('products', makeDefinition('products', 'products'));

    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0] as { index: string };
    expect(call.index).toBe('products_v1');
  });

  it('alias is created pointing to the physical index in the same call', async () => {
    const { client, createMock } = makeClient(false);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne('products', makeDefinition('products', 'products'));

    const call = createMock.mock.calls[0][0] as { body: { aliases: Record<string, unknown> } };
    expect(call.body.aliases).toHaveProperty('products');
  });

  it('bootstrapAll() calls bootstrapOne for each entry in the registry', async () => {
    const { client, createMock } = makeClient(false);
    const registry = {
      products: makeDefinition('products', 'products'),
      orders: makeDefinition('orders', 'orders'),
    };
    const bootstrapper = new IndexBootstrapper({ client, registry });

    await bootstrapper.bootstrapAll();

    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it('logs a skip message when index already exists', async () => {
    const { client } = makeClient(true);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await bootstrapper.bootstrapOne('products', makeDefinition('products', 'products'));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('products'));
  });

  it('does not throw on a registry with zero entries', async () => {
    const { client } = makeClient(false);
    const bootstrapper = new IndexBootstrapper({ client, registry: {} });

    await expect(bootstrapper.bootstrapAll()).resolves.not.toThrow();
  });
});
