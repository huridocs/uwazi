/* eslint-disable max-statements */
import { Client as ESClient } from '@elastic/elasticsearch';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { IndexNameResolver } from '../IndexNameResolver.js';
import { config } from '#api/config.js';

const mockResolver = (indexName: string) =>
  TestUtils.mockClass<IndexNameResolver>({
    resolve: jest.fn().mockResolvedValue(indexName),
    invalidate: jest.fn(),
  });

const esClient = new ESClient({
  node: config.elasticsearch.nodes,
});

const testIndexName = `tenant-aware-es-client-test-${Date.now()}-${Math.random()}`;

const testIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    properties: {
      tenantId: { type: 'keyword' },
      name: { type: 'text' },
    },
  },
};

const createSut = (tenantId = 'tenant-a') => {
  const sut = new TenantAwareESClient({
    client: esClient,
    resolver: mockResolver(testIndexName),
    tenantId,
  });

  return { sut };
};

describe('TenantAwareESClient', () => {
  beforeAll(async () => {
    try {
      await esClient.indices.delete({ index: testIndexName, ignore_unavailable: true });
    } catch (e) {
      // Ignore if index doesn't exist
    }

    await esClient.indices.create({ index: testIndexName, body: testIndexMapping });

    await esClient.bulk({
      body: [
        { index: { _index: testIndexName, _id: 'tenant-a__doc-1' } },
        { tenantId: 'tenant-a', name: 'Product A' },

        { index: { _index: testIndexName, _id: 'tenant-b__doc-1' } },
        { tenantId: 'tenant-b', name: 'Product A' },

        { index: { _index: testIndexName, _id: 'tenant-a__del-test-1' } },
        { tenantId: 'tenant-a', name: 'Product A' },

        { index: { _index: testIndexName, _id: 'tenant-b__del-test-1' } },
        { tenantId: 'tenant-b', name: 'Product B' },
      ],
      refresh: true,
    });
  });

  afterAll(async () => {
    try {
      await esClient.indices.delete({ index: testIndexName });
    } catch (e) {
      // Ignore cleanup errors
    }
    await esClient.close();
  });

  describe('constructor', () => {
    it('throws when constructed with an empty string', () => {
      expect(
        () =>
          new TenantAwareESClient({
            client: esClient,
            resolver: mockResolver(testIndexName),
            tenantId: '',
          })
      ).toThrow();
    });

    it('throws when constructed with a whitespace-only string', () => {
      expect(
        () =>
          new TenantAwareESClient({
            client: esClient,
            resolver: mockResolver(testIndexName),
            tenantId: '   ',
          })
      ).toThrow();
    });

    it('does not throw when constructed with a valid tenantId', () => {
      const { sut } = createSut();
      expect(sut).toBeDefined();
    });
  });

  describe('applyTenantGuard (verified via search)', () => {
    it('plain match_all query returns only documents for the bound tenant', async () => {
      const { sut } = createSut();

      const result = await sut.search({ alias: 'products', query: { match_all: {} } });

      result.hits.hits.forEach((hit: any) => {
        expect(hit._source.tenantId).toBe('tenant-a');
      });
    });

    it('bool query with must clause returns only documents for the bound tenant', async () => {
      const { sut } = createSut();

      const result = await sut.search({
        alias: 'products',
        query: { bool: { must: [{ match_all: {} }] } },
      });

      result.hits.hits.forEach((hit: any) => {
        expect(hit._source.tenantId).toBe('tenant-a');
      });
    });

    it('bool query with existing filter appends tenant filter, preventing cross-tenant access', async () => {
      const { sut } = createSut();

      // Tenant A tries to query for tenant-b documents while bound to tenant-a
      const result = await sut.search({
        alias: 'products',
        query: { bool: { filter: [{ term: { tenantId: 'tenant-b' } }] } },
      });

      // Should return nothing because both filters apply (tenantId = 'tenant-a' AND tenantId = 'tenant-b')
      expect(result.hits.hits).toHaveLength(0);
    });

    it('bool query with single filter object normalises to array with tenant appended', async () => {
      const { sut } = createSut();

      const result = await sut.search({
        alias: 'products',
        query: { bool: { filter: { match_all: {} } } },
      });

      result.hits.hits.forEach((hit: any) => {
        expect(hit._source.tenantId).toBe('tenant-a');
      });
    });

    it('bool query with should clauses — tenant goes in filter, preserving should semantics', async () => {
      const { sut } = createSut();

      const result = await sut.search({
        alias: 'products',
        query: { bool: { should: [{ match_all: {} }] } },
      });

      result.hits.hits.forEach((hit: any) => {
        expect(hit._source.tenantId).toBe('tenant-a');
      });
    });

    it('caller cannot override tenantId — security invariant holds even with injected filter', async () => {
      const { sut } = createSut();

      // Caller tries to inject a different tenantId via filter
      const result = await sut.search({
        alias: 'products',
        query: { bool: { filter: [{ term: { tenantId: 'tenant-b' } }] } },
      });

      // Should still be filtered to tenant-a (no cross-tenant access)
      expect(result.hits.hits).toHaveLength(0);
    });
  });

  describe('buildDocumentId & index operations', () => {
    it('document ID uses tenantId prefix format', async () => {
      const { sut } = createSut();

      await sut.index({ alias: 'products', id: 'build-id-1', document: { name: 'Test Product' } });

      // Verify document was indexed with correct ID
      await esClient.indices.refresh({ index: testIndexName });
      const result: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__build-id-1',
      });
      expect(result.body._id).toBe('tenant-a__build-id-1');
    });

    it('different tenants produce different document IDs for the same logical id', async () => {
      const { sut: sutA } = createSut('tenant-a');
      const { sut: sutB } = createSut('tenant-b');

      await sutA.index({ alias: 'products', id: 'build-same-id', document: { name: 'A Product' } });
      await sutB.index({ alias: 'products', id: 'build-same-id', document: { name: 'B Product' } });

      await esClient.indices.refresh({ index: testIndexName });

      // Both documents should exist with different IDs
      const docA: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__build-same-id',
      });
      const docB: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-b__build-same-id',
      });

      expect(docA.body._id).toBe('tenant-a__build-same-id');
      expect(docB.body._id).toBe('tenant-b__build-same-id');
    });

    it('document tenantId field is stamped with constructor-bound tenantId', async () => {
      const { sut } = createSut();

      await sut.index({
        alias: 'products',
        id: 'build-stamp-test',
        document: { name: 'Product', tenantId: 'tenant-evil' },
      });

      await esClient.indices.refresh({ index: testIndexName });
      const doc: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__build-stamp-test',
      });

      expect(doc.body._source.tenantId).toBe('tenant-a');
    });
  });

  describe('index()', () => {
    it('calls resolver with logical alias and constructor-bound tenantId', async () => {
      const resolver = mockResolver(testIndexName);
      const sut = new TenantAwareESClient({
        client: esClient,
        resolver,
        tenantId: 'tenant-a',
      });

      await sut.index({ alias: 'products', id: 'idx-resolver-test', document: { name: 'Test' } });

      expect(resolver.resolve).toHaveBeenCalledWith('products', 'tenant-a');
    });

    it('documents are indexed with correct tenant isolation', async () => {
      const { sut } = createSut();
      await sut.index({
        alias: 'products',
        id: 'idx-isolation-test',
        document: { name: 'Product A' },
      });

      await esClient.indices.refresh({ index: testIndexName });
      const result: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__idx-isolation-test',
      });

      expect(result.body._source).toMatchObject({
        tenantId: 'tenant-a',
        name: 'Product A',
      });
    });

    it('document is stamped with constructor-bound tenantId', async () => {
      const { sut } = createSut();
      await sut.index({
        alias: 'products',
        id: 'idx-stamp-test',
        document: { name: 'foo', tenantId: 'wrong-tenant' },
      });

      await esClient.indices.refresh({ index: testIndexName });
      const doc: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__idx-stamp-test',
      });

      expect(doc.body._source.tenantId).toBe('tenant-a');
    });
  });

  describe('delete()', () => {
    it('deletes only the tenant-scoped document', async () => {
      const { sut } = createSut();

      await sut.delete({ alias: 'products', id: 'del-test-1' });
      await esClient.indices.refresh({ index: testIndexName });

      // tenant-a document should be gone
      try {
        await esClient.get({ index: testIndexName, id: 'tenant-a__del-test-1' });
        fail('Expected document not found');
      } catch (e: any) {
        expect(e.statusCode).toBe(404);
      }

      // tenant-b document should still exist
      const docB: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-b__del-test-1',
      });
      expect(docB.body._id).toBe('tenant-b__del-test-1');
    });
  });

  describe('bulk()', () => {
    it('indexes all documents in bulk with tenant stamping', async () => {
      const { sut } = createSut();

      await sut.bulk({
        alias: 'products',
        operations: [
          { id: 'bulk-stamp-1', document: { name: 'Product 1' } },
          { id: 'bulk-stamp-2', document: { name: 'Product 2', tenantId: 'tenant-evil' } },
        ],
      });

      await esClient.indices.refresh({ index: testIndexName });

      // Verify both documents exist with correct tenant ID
      const doc1: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__bulk-stamp-1',
      });
      const doc2: any = await esClient.get<Record<string, unknown>>({
        index: testIndexName,
        id: 'tenant-a__bulk-stamp-2',
      });

      expect(doc1.body._source.tenantId).toBe('tenant-a');
      expect(doc2.body._source.tenantId).toBe('tenant-a');
    });

    it('does not throw when all operations succeed', async () => {
      const { sut } = createSut();

      // Use a real bulk operation - it should succeed
      await expect(
        sut.bulk({
          alias: 'products',
          operations: [{ id: 'bulk-success-1', document: { name: 'Product' } }],
        })
      ).resolves.not.toThrow();
    });

    it('all documents in bulk are stamped with constructor-bound tenantId', async () => {
      const { sut } = createSut();

      await sut.bulk({
        alias: 'products',
        operations: [
          { id: 'bulk-all-a', document: { name: 'a' } },
          { id: 'bulk-all-b', document: { name: 'b', tenantId: 'tenant-evil' } },
          { id: 'bulk-all-c', document: { name: 'c' } },
        ],
      });

      await esClient.indices.refresh({ index: testIndexName });

      // Retrieve only the documents created in this test
      const result: any = await esClient.search<Record<string, unknown>>({
        index: testIndexName,
        body: {
          query: {
            bool: {
              must: [{ term: { tenantId: 'tenant-a' } }],
              filter: [
                {
                  terms: {
                    _id: ['tenant-a__bulk-all-a', 'tenant-a__bulk-all-b', 'tenant-a__bulk-all-c'],
                  },
                },
              ],
            },
          },
          size: 100,
        },
      });

      expect(result.body.hits.hits).toHaveLength(3);
      const allHaveTenantA = result.body.hits.hits.every(
        (hit: any) => hit._source.tenantId === 'tenant-a'
      );
      expect(allHaveTenantA).toBe(true);
    });

    it('forwards routing to bulk when provided', async () => {
      const { sut } = createSut();
      const bulkSpy = jest.spyOn(esClient, 'bulk');

      await sut.bulk({
        alias: 'products',
        routing: 'tenant-a',
        operations: [{ id: 'bulk-routing-1', document: { name: 'Routing Product' } }],
      });

      expect(bulkSpy).toHaveBeenCalledWith(expect.objectContaining({ routing: 'tenant-a' }));
      bulkSpy.mockRestore();
    });
  });

  describe('routing forwarding on single-document writes', () => {
    it('forwards routing to index when provided', async () => {
      const { sut } = createSut();
      const indexSpy = jest.spyOn(esClient, 'index');

      await sut.index({
        alias: 'products',
        id: 'idx-routing-test',
        document: { name: 'Routing Index Product' },
        routing: 'tenant-a',
      });

      expect(indexSpy).toHaveBeenCalledWith(expect.objectContaining({ routing: 'tenant-a' }));
      indexSpy.mockRestore();
    });

    it('forwards routing to delete when provided', async () => {
      const { sut } = createSut();
      const id = 'del-routing-test';

      await sut.index({ alias: 'products', id, document: { name: 'Routing Delete Product' } });
      await esClient.indices.refresh({ index: testIndexName });

      const deleteSpy = jest.spyOn(esClient, 'delete');

      await sut.delete({ alias: 'products', id, routing: 'tenant-a' });

      expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining({ routing: 'tenant-a' }));
      deleteSpy.mockRestore();
    });
  });

  describe('deleteByQuery()', () => {
    it('deletes only bound-tenant documents and forwards routing', async () => {
      const { sut } = createSut();
      const marker = `dbq-routing-${Date.now()}-${Math.random()}`;

      await esClient.index({
        index: testIndexName,
        id: 'tenant-a__dbq-routing-a',
        routing: 'tenant-a',
        body: { tenantId: 'tenant-a', name: marker },
      });
      await esClient.index({
        index: testIndexName,
        id: 'tenant-b__dbq-routing-b',
        routing: 'tenant-b',
        body: { tenantId: 'tenant-b', name: marker },
      });
      await esClient.indices.refresh({ index: testIndexName });

      const deleteByQuerySpy = jest.spyOn(esClient, 'deleteByQuery');

      await sut.deleteByQuery({
        alias: 'products',
        query: { ids: { values: ['tenant-a__dbq-routing-a', 'tenant-b__dbq-routing-b'] } },
        routing: 'tenant-a',
      });

      expect(deleteByQuerySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          index: testIndexName,
          routing: 'tenant-a',
        })
      );

      await esClient.indices.refresh({ index: testIndexName });

      await expect(
        esClient.get({
          index: testIndexName,
          id: 'tenant-a__dbq-routing-a',
        })
      ).rejects.toMatchObject({ statusCode: 404 });

      const tenantBDoc: any = await esClient.get({
        index: testIndexName,
        id: 'tenant-b__dbq-routing-b',
      });
      expect(tenantBDoc.body._id).toBe('tenant-b__dbq-routing-b');

      deleteByQuerySpy.mockRestore();
    });
  });
});
