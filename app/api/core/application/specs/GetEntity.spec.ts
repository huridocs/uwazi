import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { RelationshipsAdapter } from '#api/core/infrastructure/mongodb/relationships/RelationshipsAdapter.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { GetEntityUseCase } from '../GetEntity.js';
import { EntityDoesNotExistError } from '#api/core/domain/entity/errors.js';
import { tenants } from '#api/tenants/tenantContext.js';
import db from '#api/utils/testing_db.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';

describe('GetEntityUseCase', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createUseCase = (includeRelationshipsAdapter = false) => {
    const connection = getConnection();
    const transactionManager = TransactionManagerFactory.default() as MongoTransactionManager;
    const entityDAO = new MongoEntityDAO(connection, transactionManager);

    const deps: any = { entityDAO };
    if (includeRelationshipsAdapter) {
      deps.relationshipsAdapter = new RelationshipsAdapter();
    }

    return new GetEntityUseCase(deps, {
      actor: { _id: db.id(), role: 'admin', username: 'test', email: 'test@test.com' } as any,
      tenant: tenants.current(),
    });
  };

  const createTestEntity = async (overrides: Partial<EntityDBO> = {}) => {
    const entityDBO: Partial<EntityDBO> = {
      _id: db.id(),
      sharedId: 'test-shared-id',
      language: 'en',
      title: 'Test Entity',
      published: true,
      template: db.id(),
      creationDate: Date.now(),
      editDate: Date.now(),
      metadata: {},
      obsoleteMetadata: [],
      ...overrides,
    };

    await db.mongodb?.collection('entities').insertOne(entityDBO);

    return entityDBO;
  };

  describe('execute', () => {
    it('should return entity when found by sharedId', async () => {
      const testEntity = await createTestEntity({ sharedId: 'test-entity-1' });

      const useCase = createUseCase();
      const result = await useCase.execute({ sharedId: 'test-entity-1' });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow();
      expect(entity.sharedId).toBe('test-entity-1');
      expect(entity.title).toBe(testEntity.title);
    });

    it('should return EntityDoesNotExistError when entity not found', async () => {
      const useCase = createUseCase();
      const result = await useCase.execute({ sharedId: 'nonexistent' });

      expect(result.isError()).toBe(true);
      const error = result.getError();
      expect(error).toBeInstanceOf(EntityDoesNotExistError);
    });

    it('should filter by language when specified', async () => {
      await createTestEntity({
        sharedId: 'multi-lang',
        language: 'es',
        title: 'Spanish Title',
      });
      await createTestEntity({
        sharedId: 'multi-lang',
        language: 'en',
        title: 'English Title',
      });

      const useCase = createUseCase();
      const result = await useCase.execute({
        sharedId: 'multi-lang',
        language: 'en',
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow();
      expect(entity.language).toBe('en');
      expect(entity.title).toBe('English Title');
    });

    it('should filter by published status', async () => {
      await createTestEntity({
        sharedId: 'unpublished-entity',
        published: false,
      });

      const useCase = createUseCase();

      // Try to get unpublished entity with published=true filter
      const result = await useCase.execute({
        sharedId: 'unpublished-entity',
        published: true,
      });

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(EntityDoesNotExistError);
    });

    it('should return unpublished entity when published filter not specified', async () => {
      await createTestEntity({
        sharedId: 'unpublished-entity-2',
        published: false,
      });

      const useCase = createUseCase();

      // No published filter - should find it
      const result = await useCase.execute({
        sharedId: 'unpublished-entity-2',
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow();
      expect(entity.published).toBe(false);
    });

    it('should return entity with metadata', async () => {
      await createTestEntity({
        sharedId: 'entity-with-metadata',
        metadata: {
          text: [{ value: 'test value' }],
          numeric: [{ value: 42 }],
        },
      });

      const useCase = createUseCase();
      const result = await useCase.execute({ sharedId: 'entity-with-metadata' });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow();
      expect(entity.metadata.text).toEqual([{ value: 'test value' }]);
      expect(entity.metadata.numeric).toEqual([{ value: 42 }]);
    });
  });

  describe('execute with relationships', () => {
    const hubId = db.id();
    const relatedEntityId = db.id();

    beforeEach(async () => {
      // Create main entity
      await createTestEntity({
        sharedId: 'entity-with-rels',
        language: 'en',
        title: 'Main Entity',
        published: true,
      });

      // Create related entity
      await db.mongodb?.collection('entities').insertOne({
        _id: relatedEntityId,
        sharedId: 'related-entity',
        language: 'en',
        title: 'Related Entity',
        published: true,
        template: db.id(),
      });

      // Create connections (relationships)
      await db.mongodb?.collection('connections').insertMany([
        {
          _id: db.id(),
          entity: 'entity-with-rels',
          hub: hubId,
          template: null,
        },
        {
          _id: db.id(),
          entity: 'related-entity',
          hub: hubId,
          template: db.id(),
        },
      ]);
    });

    it('should not include relationships when includeRelationships is false', async () => {
      const useCase = createUseCase(true);
      const result = await useCase.execute({
        sharedId: 'entity-with-rels',
        language: 'en',
        includeRelationships: false,
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow() as any;
      expect(entity.relations).toBeUndefined();
    });

    it('should not include relationships when relationshipsAdapter is not provided', async () => {
      const useCase = createUseCase(false); // No adapter
      const result = await useCase.execute({
        sharedId: 'entity-with-rels',
        language: 'en',
        includeRelationships: true,
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow() as any;
      expect(entity.relations).toBeUndefined();
    });

    it('should include relationships when includeRelationships is true', async () => {
      const useCase = createUseCase(true);
      const result = await useCase.execute({
        sharedId: 'entity-with-rels',
        language: 'en',
        includeRelationships: true,
        isAuthenticated: true,
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow() as any;
      expect(entity.relations).toBeDefined();
      expect(Array.isArray(entity.relations)).toBe(true);
    });

    it('should filter unpublished relationships for unauthenticated users', async () => {
      // Add an unpublished related entity
      await db.mongodb?.collection('entities').insertOne({
        _id: db.id(),
        sharedId: 'unpublished-related',
        language: 'en',
        title: 'Unpublished Related Entity',
        published: false,
        template: db.id(),
      });

      const unpublishedHubId = db.id();
      await db.mongodb?.collection('connections').insertMany([
        {
          _id: db.id(),
          entity: 'entity-with-rels',
          hub: unpublishedHubId,
          template: null,
        },
        {
          _id: db.id(),
          entity: 'unpublished-related',
          hub: unpublishedHubId,
          template: db.id(),
        },
      ]);

      const useCase = createUseCase(true);
      const result = await useCase.execute({
        sharedId: 'entity-with-rels',
        language: 'en',
        includeRelationships: true,
        isAuthenticated: false,
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow() as any;
      expect(entity.relations).toBeDefined();

      // Should not include unpublished relationships
      const unpublishedRel = entity.relations.find(
        (rel: any) => rel.entity === 'unpublished-related'
      );
      expect(unpublishedRel).toBeUndefined();
    });

    it('should include unpublished relationships for authenticated users', async () => {
      // Add an unpublished related entity
      await db.mongodb?.collection('entities').insertOne({
        _id: db.id(),
        sharedId: 'unpublished-related-2',
        language: 'en',
        title: 'Unpublished Related Entity 2',
        published: false,
        template: db.id(),
      });

      const unpublishedHubId = db.id();
      await db.mongodb?.collection('connections').insertMany([
        {
          _id: db.id(),
          entity: 'entity-with-rels',
          hub: unpublishedHubId,
          template: null,
        },
        {
          _id: db.id(),
          entity: 'unpublished-related-2',
          hub: unpublishedHubId,
          template: db.id(),
        },
      ]);

      const useCase = createUseCase(true);
      const result = await useCase.execute({
        sharedId: 'entity-with-rels',
        language: 'en',
        includeRelationships: true,
        isAuthenticated: true,
      });

      expect(result.isOk()).toBe(true);
      const entity = result.getDataOrThrow() as any;
      expect(entity.relations).toBeDefined();

      // Should include unpublished relationships for authenticated users
      const unpublishedRel = entity.relations.find(
        (rel: any) => rel.entity === 'unpublished-related-2'
      );
      expect(unpublishedRel).toBeDefined();
    });
  });
});
