import { Client } from '@elastic/elasticsearch';
import { AuthorizedEntityESClient } from '../entities/AuthorizedElasticEntityClient';
import { IndexNameResolver } from '../IndexNameResolver';
import { MongoTenantRoutingDataSource } from '../MongoTenantRoutingDataSource';
import { TenantAwareESClient } from '../TenantAwareESClient';
import { UserSchema } from '#shared/types/userType.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import {
  factory,
  publishedEntityId,
  restrictedToCollaboratorEntityId,
  restrictedToGroupEntityId,
  restrictedToOtherUserEntityId,
  adminOnlyEntityId,
  getUserById,
  elasticEntities,
  elasticTestIndex,
  tenantId,
} from './AuthorizedElasticEntityClientFixtures.js';

type CreateSutDeps = {
  actor: UserSchema | null;
  tenantId?: string;
};

const esClient = new Client({ node: 'http://localhost:9200' });

const createSut = ({ actor }: CreateSutDeps) => {
  const tenantRoutingDataSource = TestUtils.mockClass<MongoTenantRoutingDataSource>({
    findRoute: jest.fn().mockResolvedValue(null),
  });

  const resolver = new IndexNameResolver(tenantRoutingDataSource);

  const elasticClient = new TenantAwareESClient({
    client: esClient,
    resolver,
    tenantId,
  });

  const sut = new AuthorizedEntityESClient({ actor, elasticClient });

  return { sut };
};

const indexElasticEntities = async () => {
  await esClient.bulk({
    index: elasticTestIndex,
    body: elasticEntities.flatMap(({ _id, ...doc }) => [{ index: { _id } }, doc]),
  });

  await esClient.indices.refresh({ index: elasticTestIndex });
};

describe('AuthorizedElasticEntityClient', () => {
  beforeAll(async () => {
    await esClient.indices.create({
      index: elasticTestIndex,
      body: {
        settings: { number_of_shards: 1 },
        mappings: {
          properties: {
            title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            published: { type: 'boolean' },
            permissionRefIds: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            sharedId: { type: 'keyword' },
          },
        },
      },
    });

    await indexElasticEntities();
  });

  afterAll(async () => {
    await esClient.indices.delete({ index: elasticTestIndex, ignore_unavailable: true });
  });

  describe('search', () => {
    describe('Admin user authorization', () => {
      it('should return all entities without permission filtering', async () => {
        const adminUser = getUserById(factory.id('admin'));
        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        expect(result.hits.hits).toHaveLength(5);
        expect(result.hits.hits.map((h: any) => h._id)).toEqual(
          expect.arrayContaining([
            publishedEntityId,
            restrictedToCollaboratorEntityId,
            restrictedToGroupEntityId,
            restrictedToOtherUserEntityId,
            adminOnlyEntityId,
          ])
        );
      });

      it('should preserve existing query structure when adding permissions', async () => {
        const adminUser = getUserById(factory.id('admin'));

        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { term: { published: true } },
        });

        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(publishedEntityId);
      });
    });

    describe('Editor user authorization', () => {
      it('should return all entities without permission filtering', async () => {
        const editorUser = getUserById(factory.id('editor'));

        const { sut } = createSut({ actor: editorUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        expect(result.hits.hits).toHaveLength(5);
      });

      it('should not modify query for editors with complex bool queries', async () => {
        const editorUser = getUserById(factory.id('editor'));

        const { sut } = createSut({ actor: editorUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              must: [{ term: { published: true } }],
              must_not: [{ term: { title: 'Admin Only Entity' } }],
            },
          },
          size: 100,
        });

        // Should have 1 published entity that doesn't match the must_not
        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(publishedEntityId);
      });
    });

    describe('Collaborator user authorization', () => {
      it('should return published entities and entities where user has permissions', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        // Should see: published entity, entity with direct user permission, entity with group permission
        expect(result.hits.hits).toHaveLength(3);
        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).toContain(publishedEntityId);
        expect(ids).toContain(restrictedToCollaboratorEntityId);
        expect(ids).toContain(restrictedToGroupEntityId);
      });

      it('should not return entities where user has no permissions', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).not.toContain(restrictedToOtherUserEntityId);
        expect(ids).not.toContain(adminOnlyEntityId);
      });

      it('should respect user permissions alongside existing query filters', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              must: [{ match: { title: 'Restricted' } }],
            },
          },
          size: 100,
        });

        // Should respect both the title filter AND permission filter
        expect(result.hits.hits.length).toBeGreaterThanOrEqual(2);
        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).toContain(restrictedToCollaboratorEntityId);
        expect(ids).toContain(restrictedToGroupEntityId);
        expect(ids).not.toContain(restrictedToOtherUserEntityId);
      });

      it('should include entities user has group access to', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              filter: [{ term: { sharedId: restrictedToGroupEntityId } }],
            },
          },
        });

        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(restrictedToGroupEntityId);
      });

      it('should filter out entities only accessible via other users permissions', async () => {
        const collaborator2 = getUserById(factory.id('collaborator2'));

        const { sut } = createSut({ actor: collaborator2 });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).toContain(publishedEntityId);
        expect(ids).toContain(restrictedToOtherUserEntityId);
        expect(ids).not.toContain(restrictedToCollaboratorEntityId);
        expect(ids).not.toContain(restrictedToGroupEntityId);
      });
    });

    describe('Unauthenticated (null actor) authorization', () => {
      it('should only return published entities', async () => {
        const { sut } = createSut({ actor: null });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(publishedEntityId);
      });

      it('should not return any restricted entities', async () => {
        const { sut } = createSut({ actor: null });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).not.toContain(restrictedToCollaboratorEntityId);
        expect(ids).not.toContain(restrictedToGroupEntityId);
        expect(ids).not.toContain(restrictedToOtherUserEntityId);
        expect(ids).not.toContain(adminOnlyEntityId);
      });

      it('should filter published-only restriction on complex queries', async () => {
        const { sut } = createSut({ actor: null });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              should: [{ match: { title: 'Published' } }, { match: { title: 'Restricted' } }],
              minimum_should_match: 1,
            },
          },
          size: 100,
        });

        // Should match the published entity but none of the restricted ones
        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(publishedEntityId);
      });
    });

    describe('Query transformation', () => {
      it('should add permission filter to query without bool wrapper', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match: { title: 'Collaborator' } },
          size: 100,
        });

        // Should find the entity with the title match and has collaborator permission
        expect(result.hits.hits).toHaveLength(1);
        expect(result.hits.hits[0]._id).toBe(restrictedToCollaboratorEntityId);
      });

      it('should append permission filter to existing bool.filter array', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              filter: [{ term: { published: false } }],
            },
          },
          size: 100,
        });

        // Should have 2 unpublished entities where collaborator has access
        expect(result.hits.hits).toHaveLength(2);
        const ids = result.hits.hits.map((h: any) => h._id);
        expect(ids).toContain(restrictedToCollaboratorEntityId);
        expect(ids).toContain(restrictedToGroupEntityId);
      });

      it('should convert single bool.filter to array when adding permission filter', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: {
            bool: {
              filter: { term: { published: false } },
            },
          },
          size: 100,
        });

        expect(result.hits.hits).toHaveLength(2);
      });

      it('should wrap non-bool queries in bool must and filter', async () => {
        const collaborator = getUserById(factory.id('collaborator'));

        const { sut } = createSut({ actor: collaborator });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        expect(result.hits.hits.length).toBeGreaterThan(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty permission filter gracefully for admin', async () => {
        const adminUser = getUserById(factory.id('admin'));

        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        expect(result.hits.hits).toHaveLength(5);
      });

      it('should handle collaborator with no groups', async () => {
        const collaborator2 = getUserById(factory.id('collaborator2'));

        const { sut } = createSut({ actor: collaborator2 });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
        });

        // Should see published entity and one with direct permission
        expect(result.hits.hits).toHaveLength(2);
      });

      it('should support pagination with permission filtering', async () => {
        const adminUser = getUserById(factory.id('admin'));

        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 2,
          from: 0,
        });

        expect(result.hits.hits.length).toBeLessThanOrEqual(2);
      });

      it('should support sorting with permission filtering', async () => {
        const adminUser = getUserById(factory.id('admin'));

        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
          sort: [{ 'title.keyword': 'asc' }],
        });

        expect(result.hits.hits).toHaveLength(5);
      });

      it('should support source filtering with permission filtering', async () => {
        const adminUser = getUserById(factory.id('admin'));

        const { sut } = createSut({ actor: adminUser });

        const result = await sut.search({
          alias: elasticTestIndex,
          query: { match_all: {} },
          size: 100,
          source: ['title', 'published'],
        });

        expect(result.hits.hits).toHaveLength(5);
      });
    });
  });
});
