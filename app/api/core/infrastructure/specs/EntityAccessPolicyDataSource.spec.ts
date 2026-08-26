import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { EntityAccessPolicyDataSourceFactory } from '../factories/EntityAccessPolicyDataSourceFactory.js';
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';

const factory = getFixturesFactory();

const sharedId = 'entity-shared-1';

const createFixtures = (): DBFixture => ({
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  templates: [factory.template('template_1', [])],
  entities: [
    factory.entity(
      'entity-shared-1',
      'template_1',
      {},
      { language: 'en', published: false, permissions: [] }
    ),
    factory.entity(
      'entity-shared-1',
      'template_1',
      {},
      { language: 'es', published: false, permissions: [] }
    ),
    factory.entity(
      'other-entity',
      'template_1',
      {},
      {
        language: 'en',
        published: true,
        permissions: [{ refId: 'user-x', type: 'user', level: 'write' }],
      }
    ),
  ],
});

const backends = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('EntityAccessPolicyDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true, elasticIndex: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(backends)('$name backend', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresEntities: usePostgres, postgresFiles: usePostgres },
      });
      await testingPG.clear(['entities']);
      await testingEnvironment.setFixtures(createFixtures());
    });

    const createSut = () =>
      testingEnvironment.runWithContext(() => {
        const sut = EntityAccessPolicyDataSourceFactory.default();
        return {
          sut,
          transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
        };
      });

    const getAllEntities = async () => {
      if (usePostgres) {
        const rows = await testingPG.getAllFrom<Record<string, unknown>>('entities');
        return rows.map(row =>
          Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))
        );
      }
      return testingEnvironment.db.getAllFrom('entities');
    };

    describe('update()', () => {
      it('replaces the existing permissions array on all language documents', async () => {
        const { sut } = createSut();

        await sut.update(
          new EntityAccessPolicy({
            sharedId,
            grants: [{ refId: 'new-user', type: GrantType.Group, level: AccessLevel.Read }],
            isPublic: false,
          })
        );

        const docs = (await getAllEntities()).filter(d => d.sharedId === sharedId);
        expect(docs).toHaveLength(2);
        docs.forEach(doc => {
          expect(doc.permissions).toEqual([{ refId: 'new-user', type: 'group', level: 'read' }]);
        });
      });

      it('does not affect other fields on the entity document', async () => {
        const { sut } = createSut();

        await sut.update(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));

        const docs = (await getAllEntities()).filter(d => d.sharedId === sharedId);
        expect(docs).toHaveLength(2);
        // language and sharedId must be preserved on every language document
        expect(docs.map(d => d.language).sort()).toEqual(['en', 'es']);
        docs.forEach(doc => {
          expect(doc.sharedId).toBe(sharedId);
        });
      });
    });

    describe('bulkUpdate()', () => {
      it('persists all policies in the list', async () => {
        const { sut } = createSut();

        const policy1 = new EntityAccessPolicy({
          sharedId,
          grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: false,
        });
        const policy2 = new EntityAccessPolicy({
          sharedId: 'other-entity',
          grants: [],
          isPublic: true,
        });

        await sut.bulkUpdate([policy1, policy2]);

        const docs1 = (await getAllEntities()).filter(d => d.sharedId === sharedId);
        expect(docs1).toHaveLength(2);
        docs1.forEach(doc => {
          expect(doc.permissions).toEqual([{ refId: 'u1', type: 'user', level: 'write' }]);
          expect(doc.published).toBe(false);
        });

        const docs2 = (await getAllEntities()).filter(d => d.sharedId === 'other-entity');
        expect(docs2).toHaveLength(1);
        expect(docs2[0].published).toBe(true);
      });

      it('is a no-op for an empty list', async () => {
        const { sut } = createSut();
        await expect(sut.bulkUpdate([])).resolves.toBeUndefined();
      });
    });

    describe('bulkCreate()', () => {
      it('persists all policies in a single bulk operation', async () => {
        const { sut } = createSut();

        const policy1 = new EntityAccessPolicy({
          sharedId,
          grants: [{ refId: 'u2', type: GrantType.User, level: AccessLevel.Read }],
          isPublic: false,
        });
        const policy2 = new EntityAccessPolicy({
          sharedId: 'other-entity',
          grants: [],
          isPublic: true,
        });

        await sut.bulkCreate([policy1, policy2]);

        const docs1 = (await getAllEntities()).filter(d => d.sharedId === sharedId);
        expect(docs1).toHaveLength(2);
        docs1.forEach(doc => {
          expect(doc.permissions).toEqual([{ refId: 'u2', type: 'user', level: 'read' }]);
          expect(doc.published).toBe(false);
        });

        const docs2 = (await getAllEntities()).filter(d => d.sharedId === 'other-entity');
        expect(docs2).toHaveLength(1);
        expect(docs2[0].published).toBe(true);
      });

      it('does not affect other entities not in the list', async () => {
        const { sut } = createSut();

        await sut.bulkCreate([new EntityAccessPolicy({ sharedId, grants: [], isPublic: false })]);

        const other = (await getAllEntities()).filter(d => d.sharedId === 'other-entity');
        expect(other).toHaveLength(1);
        expect(other[0].published).toBe(true);
        expect(other[0].permissions).toEqual([{ refId: 'user-x', type: 'user', level: 'write' }]);
      });

      it('is a no-op for an empty list', async () => {
        const { sut } = createSut();
        await expect(sut.bulkCreate([])).resolves.toBeUndefined();
      });
    });

    describe('getBySharedId()', () => {
      it('returns the access policy with correct grants', async () => {
        const { sut } = createSut();

        await sut.bulkCreate([
          new EntityAccessPolicy({
            sharedId,
            grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Write }],
            isPublic: false,
          }),
        ]);

        const result = await sut.getBySharedId(sharedId);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getData().sharedId).toBe(sharedId);
          expect(result.getData().isPublic).toBe(false);
          expect(result.getData().grants).toHaveLength(1);
          expect(result.getData().grants[0]).toMatchObject({
            refId: 'u1',
            type: 'user',
            level: 'write',
          });
        }
      });

      it('excludes the public sentinel from the grants list', async () => {
        const { sut } = createSut();

        await sut.bulkCreate([new EntityAccessPolicy({ sharedId, grants: [], isPublic: true })]);

        const result = await sut.getBySharedId(sharedId);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getData().isPublic).toBe(true);
          // The 'public' sentinel must NOT appear as an AccessGrant
          expect(result.getData().grants.find(g => g.refId === 'public')).toBeUndefined();
        }
      });

      it('returns failure when sharedId does not exist', async () => {
        const { sut } = createSut();

        const result = await sut.getBySharedId('non-existent');
        expect(result.isOk()).toBe(false);
        if (!result.isOk()) {
          expect(result.getError()).toBeInstanceOf(EntityAccessPolicyNotFoundError);
        }
      });
    });

    describe('getBySharedIds()', () => {
      it('returns one EntityAccessPolicy per sharedId (deduplicates language copies)', async () => {
        const { sut } = createSut();

        const results = await sut.getBySharedIds([sharedId, 'other-entity']);

        expect(results).toHaveLength(2);
        const ids = results.map(r => r.sharedId).sort();
        expect(ids).toEqual(['entity-shared-1', 'other-entity'].sort());
      });

      it('returns an empty array for an empty input', async () => {
        const { sut } = createSut();
        expect(await sut.getBySharedIds([])).toEqual([]);
      });
    });

    describe('on-commit indexing', () => {
      it('reindexes entities updated via update/bulkUpdate on commit', async () => {
        const { sut, transactionManager } = createSut();

        await transactionManager.run(async () => {
          await sut.update(
            new EntityAccessPolicy({ sharedId: 'other-entity', grants: [], isPublic: false })
          );
          await sut.bulkUpdate([
            new EntityAccessPolicy({
              sharedId,
              grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Write }],
              isPublic: true,
            }),
          ]);
        });

        await elasticTesting.refresh();
        const indexed = await elasticTesting.getIndexedEntities();

        const other = indexed.find(e => e.sharedId === 'other-entity');
        expect(other?.permissions).toEqual([]);
        expect(other?.published).toBe(false);

        const shared = indexed.find(e => e.sharedId === sharedId);
        expect(shared?.permissions).toEqual([{ refId: 'u1', type: 'user', level: 'write' }]);
        expect(shared?.published).toBe(true);
      });

      it('does not reindex entities created via bulkCreate', async () => {
        const { sut, transactionManager } = createSut();

        // Ensure ES reflects the current DB fixtures before exercising bulkCreate.
        await elasticTesting.reindex();

        await transactionManager.run(async () => {
          await sut.bulkCreate([
            new EntityAccessPolicy({
              sharedId,
              grants: [{ refId: 'u2', type: GrantType.User, level: AccessLevel.Read }],
              isPublic: false,
            }),
          ]);
        });

        await elasticTesting.refresh();
        const indexed = await elasticTesting.getIndexedEntities();
        const shared = indexed.find(e => e.sharedId === sharedId);
        // bulkCreate does not trigger reindexing, so ES still has the fixture state.
        expect(shared?.permissions).toEqual([]);
      });
    });
  });
});
