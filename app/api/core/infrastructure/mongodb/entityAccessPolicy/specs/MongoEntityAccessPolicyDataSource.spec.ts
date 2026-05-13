import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import {
  MongoEntityAccessPolicyDataSource,
  MongoEntityAccessPolicyDataSourceDeps,
} from '../MongoEntityAccessPolicyDataSource.js';
import { EntityAccessPolicy } from '#api/core/domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { EntityIndexerServiceFactory } from '#api/core/infrastructure/factories/EntityIndexerServiceFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';

const sharedId = 'entity-shared-1';

const fixtures: DBFixture = {
  entities: [
    {
      _id: new ObjectId(),
      sharedId,
      language: 'en',
      published: false,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId,
      language: 'es',
      published: false,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: 'other-entity',
      language: 'en',
      published: true,
      permissions: [{ refId: 'user-x', type: 'user', level: 'write' }],
    },
  ],
};

const createSut = (_deps?: Partial<MongoEntityAccessPolicyDataSourceDeps>) => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();

  const deps: MongoEntityAccessPolicyDataSourceDeps = {
    db,
    transactionManager,
    entityIndexerService: EntityIndexerServiceFactory.forTests(),
    searchV1: TestUtils.mockClass<MongoEntityAccessPolicyDataSourceDeps['searchV1']>({
      indexEntities: jest.fn().mockResolvedValue(undefined),
    }),
    ..._deps,
  };

  return {
    sut: new MongoEntityAccessPolicyDataSource(deps),
    ...deps,
  };
};

describe('MongoEntityAccessPolicyDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('create()', () => {
    it('writes permissions and published to all language documents', async () => {
      const { sut } = createSut();

      const policy = new EntityAccessPolicy({
        sharedId,
        grants: [{ refId: 'user-1', type: GrantType.User, level: AccessLevel.Write }],
        isPublic: false,
      });

      await sut.create(policy);

      const docs = await getConnection().collection('entities').find({ sharedId }).toArray();

      expect(docs).toHaveLength(2);
      docs.forEach(doc => {
        expect(doc.published).toBe(false);
        expect(doc.permissions).toEqual([{ refId: 'user-1', type: 'user', level: 'write' }]);
      });
    });

    it('writes the public sentinel entry when isPublic is true', async () => {
      const { sut } = createSut();

      const policy = new EntityAccessPolicy({ sharedId, grants: [], isPublic: true });

      await sut.create(policy);

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc!.published).toBe(true);
    });

    it('does not affect other entities', async () => {
      const { sut } = createSut();

      await sut.create(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));

      const other = await getConnection()
        .collection('entities')
        .findOne({ sharedId: 'other-entity' });

      expect(other!.published).toBe(true);
      expect(other!.permissions).toEqual([{ refId: 'user-x', type: 'user', level: 'write' }]);
    });
  });

  describe('update()', () => {
    it('replaces the existing permissions array', async () => {
      const { sut } = createSut();

      await sut.create(
        new EntityAccessPolicy({
          sharedId,
          grants: [{ refId: 'old-user', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: false,
        })
      );

      // Replace with new grants
      await sut.update(
        new EntityAccessPolicy({
          sharedId,
          grants: [{ refId: 'new-user', type: GrantType.Group, level: AccessLevel.Read }],
          isPublic: false,
        })
      );

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc!.permissions).toEqual([{ refId: 'new-user', type: 'group', level: 'read' }]);
    });

    it('does not affect other fields on the entity document', async () => {
      const { sut } = createSut();

      await sut.update(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      // language and sharedId must be preserved
      expect(doc!.language).toBe('en');
      expect(doc!.sharedId).toBe(sharedId);
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

      const doc1 = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc1!.permissions).toEqual([{ refId: 'u1', type: 'user', level: 'write' }]);
      expect(doc1!.published).toBe(false);

      const doc2 = await getConnection()
        .collection('entities')
        .findOne({ sharedId: 'other-entity' });
      expect(doc2!.published).toBe(true);
    });

    it('adds all mutated sharedIds to the indexer on commit', async () => {
      const { sut, transactionManager, entityIndexerService } = createSut();

      await transactionManager.run(async () => {
        await sut.bulkUpdate([
          new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }),
          new EntityAccessPolicy({ sharedId: 'other-entity', grants: [], isPublic: false }),
        ]);
      });

      expect(entityIndexerService.sync).toHaveBeenCalledWith(
        expect.arrayContaining([sharedId, 'other-entity'])
      );
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

      const docs1 = await getConnection().collection('entities').find({ sharedId }).toArray();
      expect(docs1).toHaveLength(2);
      docs1.forEach(doc => {
        expect(doc.permissions).toEqual([{ refId: 'u2', type: 'user', level: 'read' }]);
        expect(doc.published).toBe(false);
      });

      const doc2 = await getConnection()
        .collection('entities')
        .findOne({ sharedId: 'other-entity' });
      expect(doc2!.published).toBe(true);
    });

    it('adds all created sharedIds to the indexer on commit', async () => {
      const { sut, transactionManager, entityIndexerService } = createSut();

      await transactionManager.run(async () => {
        await sut.bulkCreate([
          new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }),
          new EntityAccessPolicy({ sharedId: 'other-entity', grants: [], isPublic: false }),
        ]);
      });

      expect(entityIndexerService.sync).toHaveBeenCalledWith(
        expect.arrayContaining([sharedId, 'other-entity'])
      );
    });

    it('does not affect other entities not in the list', async () => {
      const { sut } = createSut();

      await sut.bulkCreate([new EntityAccessPolicy({ sharedId, grants: [], isPublic: false })]);

      const other = await getConnection()
        .collection('entities')
        .findOne({ sharedId: 'other-entity' });
      expect(other!.published).toBe(true);
      expect(other!.permissions).toEqual([{ refId: 'user-x', type: 'user', level: 'write' }]);
    });

    it('is a no-op for an empty list', async () => {
      const { sut } = createSut();
      await expect(sut.bulkCreate([])).resolves.toBeUndefined();
    });
  });

  describe('getBySharedId()', () => {
    it('returns the access policy with correct grants', async () => {
      const { sut } = createSut();

      await sut.create(
        new EntityAccessPolicy({
          sharedId,
          grants: [{ refId: 'u1', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: false,
        })
      );

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

      await sut.create(new EntityAccessPolicy({ sharedId, grants: [], isPublic: true }));

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
    it('calls entityIndexerService.sync with all updated sharedIds after commit', async () => {
      const { sut, transactionManager, entityIndexerService } = createSut();

      const other = 'other-entity';

      await transactionManager.run(async () => {
        await sut.update(new EntityAccessPolicy({ sharedId: other, grants: [], isPublic: true }));
        await sut.bulkUpdate([
          new EntityAccessPolicy({ sharedId: other, grants: [], isPublic: true }),
        ]);
        await sut.bulkCreate([new EntityAccessPolicy({ sharedId, grants: [], isPublic: false })]);
        await sut.create(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));
      });

      expect(entityIndexerService.sync).toHaveBeenCalledWith([other]);
    });

    it('does not call entityIndexerService.sync when no mutations occurred', async () => {
      const { transactionManager, entityIndexerService } = createSut();

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      expect(entityIndexerService.sync).not.toHaveBeenCalled();
    });

    it('calls searchV1.indexEntities with all updated sharedIds after commit', async () => {
      const { sut, transactionManager, searchV1 } = createSut();

      const other = 'other-entity';

      await transactionManager.run(async () => {
        await sut.update(new EntityAccessPolicy({ sharedId: other, grants: [], isPublic: true }));
        await sut.bulkUpdate([
          new EntityAccessPolicy({ sharedId: other, grants: [], isPublic: true }),
        ]);
        await sut.bulkCreate([new EntityAccessPolicy({ sharedId, grants: [], isPublic: false })]);
        await sut.create(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));
      });

      expect(searchV1.indexEntities).toHaveBeenCalledWith({ sharedId: { $in: ['other-entity'] } });
    });

    it('does not call searchV1.indexEntities when no mutations occurred', async () => {
      const { transactionManager, searchV1 } = createSut();

      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      expect(searchV1.indexEntities).not.toHaveBeenCalled();
    });

    it('clears the mutated set between transactions', async () => {
      const { sut, transactionManager, entityIndexerService, searchV1 } = createSut();

      await transactionManager.run(async () => {
        await sut.create(new EntityAccessPolicy({ sharedId, grants: [], isPublic: false }));
      });

      (entityIndexerService.sync as any).mockClear();
      (searchV1.indexEntities as any).mockClear();

      // Second transaction with no mutations
      await transactionManager.run(async () => {
        await Promise.resolve();
      });

      expect(entityIndexerService.sync).not.toHaveBeenCalled();
      expect(searchV1.indexEntities).not.toHaveBeenCalled();
    });
  });
});
