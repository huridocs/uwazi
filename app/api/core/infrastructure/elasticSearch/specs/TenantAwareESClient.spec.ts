import type { Client } from '@elastic/elasticsearch';
import { TenantAwareESClient } from '../TenantAwareESClient';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { BulkIndexingError } from '../Types';
import { TenantIndexResolver } from '../TenantIndexResolver';

const makeResolver = (alias = 'resolved-index') =>
  TestUtils.mockClass<TenantIndexResolver>({
    resolve: jest.fn().mockResolvedValue(alias),
    invalidate: jest.fn(),
  });

const makeClient = (overrides: Partial<Record<string, jest.Mock>> = {}): Client => {
  const defaults = {
    search: jest.fn().mockResolvedValue({ body: { hits: { hits: [] } } }),
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    bulk: jest.fn().mockResolvedValue({ body: { errors: false, items: [] } }),
  };
  return { ...defaults, ...overrides } as unknown as Client;
};

describe('TenantAwareESClient', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterAll(() => {
    jest.spyOn(console, 'log').mockRestore();
  });

  describe('constructor', () => {
    it('throws when constructed with an empty string', () => {
      expect(
        () =>
          new TenantAwareESClient({
            client: makeClient(),
            resolver: makeResolver(),
            tenantId: '',
          })
      ).toThrow();
    });

    it('throws when constructed with a whitespace-only string', () => {
      expect(
        () =>
          new TenantAwareESClient({
            client: makeClient(),
            resolver: makeResolver(),
            tenantId: '   ',
          })
      ).toThrow();
    });

    it('does not throw when constructed with a valid tenantId', () => {
      expect(
        () =>
          new TenantAwareESClient({
            client: makeClient(),
            resolver: makeResolver(),
            tenantId: 'tenant-a',
          })
      ).not.toThrow();
    });
  });

  describe('applyTenantGuard (verified via search)', () => {
    const getSearchBody = (client: Client): Record<string, unknown> => {
      const mock = (client.search as jest.Mock).mock.calls[0][0];
      return mock.body as Record<string, unknown>;
    };

    it('plain match_all query is wrapped in bool.must, tenant in bool.filter', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      await sut.search({ alias: 'products', query: { match_all: {} } });

      const body = getSearchBody(client);
      const query = body.query as Record<string, unknown>;
      expect(query.bool).toBeDefined();
      const bool = query.bool as Record<string, unknown>;
      expect(bool.must).toEqual([{ match_all: {} }]);
      expect(bool.filter).toEqual([{ term: { tenantId: 'tenant-a' } }]);
    });

    it('bool query with no filter gets tenant added to bool.filter', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.search({
        alias: 'products',
        query: { bool: { must: [{ term: { id: '1' } }] } },
      });

      const body = getSearchBody(client);
      const bool = (body.query as Record<string, unknown>).bool as Record<string, unknown>;
      expect(bool.must).toEqual([{ term: { id: '1' } }]);
      expect(bool.filter).toEqual([{ term: { tenantId: 'tenant-a' } }]);
    });

    it('bool query with existing filter array appends tenant, preserving existing filters', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.search({
        alias: 'products',
        query: { bool: { filter: [{ term: { status: 'active' } }] } },
      });

      const body = getSearchBody(client);
      const bool = (body.query as Record<string, unknown>).bool as Record<string, unknown[]>;
      expect(bool.filter).toHaveLength(2);
      expect(bool.filter[0]).toEqual({ term: { status: 'active' } });
      expect(bool.filter[1]).toEqual({ term: { tenantId: 'tenant-a' } });
    });

    it('bool query with single filter object is normalised to array, tenant appended', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.search({
        alias: 'products',
        query: { bool: { filter: { term: { status: 'active' } } } },
      });

      const body = getSearchBody(client);
      const bool = (body.query as Record<string, unknown>).bool as Record<string, unknown[]>;
      expect(Array.isArray(bool.filter)).toBe(true);
      expect(bool.filter).toHaveLength(2);
      expect(bool.filter[1]).toEqual({ term: { tenantId: 'tenant-a' } });
    });

    it('bool query with should clauses — tenant goes in filter, not inside should', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.search({
        alias: 'products',
        query: { bool: { should: [{ term: { name: 'foo' } }] } },
      });

      const body = getSearchBody(client);
      const bool = (body.query as Record<string, unknown>).bool as Record<string, unknown>;
      expect(bool.should).toEqual([{ term: { name: 'foo' } }]);
      expect(bool.filter).toEqual([{ term: { tenantId: 'tenant-a' } }]);
    });

    it('caller cannot override tenantId by including it in their own query', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      // Caller tries to inject a different tenantId via filter
      await sut.search({
        alias: 'products',
        query: { bool: { filter: [{ term: { tenantId: 'tenant-evil' } }] } },
      });

      const body = getSearchBody(client);
      const bool = (body.query as Record<string, unknown>).bool as Record<string, unknown[]>;
      // The real tenant filter is appended; the attacker's filter is harmless but present
      const tenantFilters = bool.filter.filter(
        f => (f as Record<string, unknown>).term !== undefined
      ) as Array<{ term: { tenantId: string } }>;
      const tenantIds = tenantFilters.map(f => f.term.tenantId);
      // Invariant: constructor-bound tenantId is always among filters
      expect(tenantIds).toContain('tenant-a');
    });
  });

  describe('buildDocumentId (verified via index)', () => {
    const getIndexCall = (client: Client) => (client.index as jest.Mock).mock.calls[0][0];

    it('format is tenantId__id', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.index({ alias: 'products', id: 'doc-1', document: {} });

      expect(getIndexCall(client).id).toBe('tenant-a__doc-1');
    });

    it('two instances with different tenantIds produce different document IDs', async () => {
      const clientA = makeClient();
      const clientB = makeClient();
      const sutA = new TenantAwareESClient({
        client: clientA,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      const sutB = new TenantAwareESClient({
        client: clientB,
        resolver: makeResolver(),
        tenantId: 'tenant-b',
      });

      await sutA.index({ alias: 'products', id: 'same-id', document: {} });
      await sutB.index({ alias: 'products', id: 'same-id', document: {} });

      expect(getIndexCall(clientA).id).toBe('tenant-a__same-id');
      expect(getIndexCall(clientB).id).toBe('tenant-b__same-id');
    });
  });

  describe('stampTenantId (verified via index)', () => {
    it('a document with a different tenantId has it overwritten with this.tenantId', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });

      await sut.index({
        alias: 'products',
        id: 'doc-1',
        document: { tenantId: 'tenant-evil', name: 'foo' },
      });

      const body = (client.index as jest.Mock).mock.calls[0][0].body as Record<string, unknown>;
      expect(body.tenantId).toBe('tenant-a');
    });
  });

  describe('index()', () => {
    it('calls resolver with logical alias and constructor-bound tenantId', async () => {
      const resolver = makeResolver('products_v1');
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver,
        tenantId: 'tenant-a',
      });

      await sut.index({ alias: 'products', id: 'doc-1', document: {} });

      expect(resolver.resolve).toHaveBeenCalledWith('products', 'tenant-a');
    });

    it('uses resolved alias in ES call', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver('products_v1'),
        tenantId: 'tenant-a',
      });
      await sut.index({ alias: 'products', id: 'doc-1', document: {} });

      expect((client.index as jest.Mock).mock.calls[0][0].index).toBe('products_v1');
    });

    it('document is stamped with constructor-bound tenantId', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      await sut.index({ alias: 'products', id: 'doc-1', document: { name: 'foo' } });

      const body = (client.index as jest.Mock).mock.calls[0][0].body as Record<string, unknown>;
      expect(body.tenantId).toBe('tenant-a');
    });
  });

  describe('bulk()', () => {
    it('throws BulkIndexingError when response contains errors', async () => {
      const client = makeClient({
        bulk: jest.fn().mockResolvedValue({ body: { errors: true, items: [] } }),
      });
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      await expect(
        sut.bulk({ alias: 'products', operations: [{ id: '1', document: {} }] })
      ).rejects.toThrow(BulkIndexingError);
    });

    it('does not throw when all operations succeed', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      await expect(
        sut.bulk({ alias: 'products', operations: [{ id: '1', document: {} }] })
      ).resolves.not.toThrow();
    });

    it('all documents in bulk are stamped with constructor-bound tenantId', async () => {
      const client = makeClient();
      const sut = new TenantAwareESClient({
        client,
        resolver: makeResolver(),
        tenantId: 'tenant-a',
      });
      await sut.bulk({
        alias: 'products',
        operations: [
          { id: '1', document: { name: 'a' } },
          { id: '2', document: { name: 'b', tenantId: 'tenant-evil' } },
        ],
      });

      const bulkBody = (client.bulk as jest.Mock).mock.calls[0][0].body as unknown[];
      // body is flat: [action, doc, action, doc, ...]
      const docs = bulkBody.filter((_item, i) => i % 2 === 1) as Array<Record<string, unknown>>;
      expect(docs.every(d => d.tenantId === 'tenant-a')).toBe(true);
    });
  });
});
