/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { elastic, search } from 'api/search';
import { Collection, ObjectId } from 'mongodb';
import { TestUtils } from 'api/common.v2/utils/Test';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MongoEntityPermissionChecker } from 'api/core/infrastructure/mongodb/entity/MongoEntityPermissionChecker';
import {
  getConnection,
  getSharedConnection,
} from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { UserSchema } from 'shared/types/userType';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { BulkDeleteEntityInput, BulkDeleteEntityUseCase } from '../BulkDeleteEntity';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  relationtypes: [
    {
      _id: factory.id('relation_type'),
      name: 'relation_type',
      properties: [],
      __v: 0,
    },
  ],

  templates: [
    factory.template('Document A'),
    factory.template('Document B'),
    factory.template('Document C'),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'A1',
      'Document A',
      {},
      { title: 'A' },
      {
        en: {
          title: 'Document A1 EN',
        },
        es: {
          title: 'Document A1 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'A2',
      'Document A',
      {},
      { title: 'A2' },
      {
        en: {
          title: 'Document A2 EN',
        },
        es: {
          title: 'Document A2 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'B1',
      'Document B',
      {},
      { title: 'B1' },
      {
        en: {
          title: 'Document B1 EN',
        },
        es: {
          title: 'Document B1 ES',
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'C1',
      'Document C',
      {},
      { title: 'C1' },
      {
        en: {
          title: 'Document C1 EN',
        },
        es: {
          title: 'Document C1 ES',
        },
      }
    ),
  ],
};

type CreateSutProps = {
  search?: typeof search;
  jobsDispatcher?: JobsDispatcher;
  actor?: UserSchema;
  entitiesDS?: MultiLanguageEntityDataSource;
};

const createSut = (props?: CreateSutProps) => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const jobsDispatcher =
    props?.jobsDispatcher ?? DefaultDispatcher(tenants.current().name, transactionManager);
  const searchInstance = props?.search ?? search;
  const entityPermissionChecker = new MongoEntityPermissionChecker(
    getConnection(),
    transactionManager
  );
  const entitiesDS =
    props?.entitiesDS ??
    new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

  const actor =
    props?.actor ??
    ({
      _id: new ObjectId(),
      role: 'admin',
      groups: [],
      email: 'email@email.com',
      username: 'username',
    } as UserSchema);

  const sut = new BulkDeleteEntityUseCase(
    {
      search: searchInstance,
      entityPermissionChecker,
      jobsDispatcher,
      idGenerator,
      transactionManager,
      entitiesDS,
    },
    {
      actor,
      tenant: tenants.current(),
    }
  );

  return {
    sut,
    actor,
  };
};

describe('BulkDeleteEntityUseCase', () => {
  let jobsCollection: Collection;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'bulk_delete_entity_use_case');

    jobsCollection = getSharedConnection().collection('jobs');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await testingEnvironment.setElastic('bulk_delete_entity_use_case');
    await jobsCollection.deleteMany({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete entities', async () => {
    const { sut, actor } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await sut.execute(input);

    const elasticResult = await elastic.search({ size: 100 });

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
    const jobs = await jobsCollection.find().toArray();

    // Should delete Entities sync.
    const dbSharedIds = entitiesDB.map((entity: any) => entity.sharedId);
    expect(dbSharedIds).not.toContain(['A1', 'A2', 'B1']);
    expect(dbSharedIds).toEqual(['C1', 'C1']);

    // Should have created jobs for deletion.
    expect(jobs).toEqual([
      {
        name: 'BulkCleanupEntityJob',
        params: {
          tenantName: tenants.current().name,
          userId: actor!._id!.toString(),
          sharedIds: expect.arrayContaining(['A1', 'A2', 'B1']),
        },
        queue: 'uwazi_jobs',
        namespace: tenants.current().name,

        _id: expect.any(ObjectId),
        createdAt: expect.any(Number),
        lockedUntil: 0,
        retryCount: 0,
        failed: false,
        options: { lockWindow: 600000, maxRetries: 5 },
      },
    ]);

    // Should not delete C1 from elastic
    const remainingIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);
    expect(remainingIds).not.toContain(['A1', 'A2', 'B1']);
    expect(remainingIds).toEqual(['C1', 'C1']);
  });

  it('should revert when search deletion fails', async () => {
    const searchMock = TestUtils.mockClass<typeof search>({
      bulkDeleteBySharedId: jest.fn().mockRejectedValue(new Error('Deletion failed')),
    });

    const { sut } = createSut({ search: searchMock });

    const entitiesDBBefore = await testingEnvironment.db.getAllFrom('entities');
    const jobsBefore = await jobsCollection.find().toArray();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Deletion failed');

    const entitiesDBAfter = await testingEnvironment.db.getAllFrom('entities');
    const jobsAfter = await jobsCollection.find().toArray();

    expect(jobsBefore).toEqual(jobsAfter);

    expect(entitiesDBBefore).toEqual(entitiesDBAfter);
  });

  it('should revert when dispatching of jobs fails', async () => {
    const jobsDispatcher = TestUtils.mockClass<JobsDispatcher>({
      dispatchMany: jest.fn().mockRejectedValue(new Error('Dispatch failed')),
    });

    const { sut } = createSut({ jobsDispatcher });

    const entitiesDBBefore = await testingEnvironment.db.getAllFrom('entities');
    const elasticBefore = await elastic.search({ size: 100 });

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Dispatch failed');

    const elasticAfter = await elastic.search({ size: 100 });
    const entitiesDBAfter = await testingEnvironment.db.getAllFrom('entities');

    expect(entitiesDBBefore).toEqual(entitiesDBAfter);
    expect(elasticBefore.body.hits.hits).toEqual(elasticAfter.body.hits.hits);
  });

  it('should revert when deletion of entities on db fails', async () => {
    const entitiesDS = TestUtils.mockClass<MultiLanguageEntityDataSource>({
      bulkDelete: jest.fn().mockRejectedValue(new Error('Fail')),
    });

    const { sut } = createSut({ entitiesDS });

    const jobsBefore = await jobsCollection.find().toArray();
    const elasticBefore = await elastic.search({ size: 100 });

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Fail');

    const elasticAfter = await elastic.search({ size: 100 });
    const jobsAfter = await jobsCollection.find().toArray();

    expect(jobsBefore).toEqual(jobsAfter);
    expect(elasticBefore.body.hits.hits).toEqual(elasticAfter.body.hits.hits);
  });

  it('should handle entities that do not exist gracefully', async () => {
    const mockedSearch = TestUtils.mockClass<typeof search>({
      bulkDeleteBySharedId: jest.fn().mockResolvedValue(undefined),
    });

    const { sut } = createSut({ search: mockedSearch });

    const input: BulkDeleteEntityInput = {
      sharedIds: ['NON_EXISTENT_ID_1', 'NON_EXISTENT_ID_2', 'A1'],
    };

    await sut.execute(input);

    // should not attempt to delete non existent entities
    expect(mockedSearch.bulkDeleteBySharedId).toHaveBeenCalledWith(['A1']);
  });

  it('should deduplicate sharedIds before processing', async () => {
    const mockedSearch = TestUtils.mockClass<typeof search>({
      bulkDeleteBySharedId: jest.fn().mockResolvedValue(undefined),
    });

    const { sut } = createSut({ search: mockedSearch });

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'A1', 'B1', 'A2'],
    };

    await sut.execute(input);

    expect(mockedSearch.bulkDeleteBySharedId).toHaveBeenCalledWith(
      expect.arrayContaining(['A1', 'A2', 'B1'])
    );
  });

  it('should create jobs in chunks of 100 items', async () => {
    const { sut } = createSut();
    const sharedIds = Array.from({ length: 201 }, (_, i) => `ID_${i + 1}`);

    await testingEnvironment.db
      .getCollection('entities')
      ?.insertMany(
        sharedIds.flatMap(id =>
          factory.entityInMultipleLanguages(['en', 'es'], id, 'Document A')
        ) as any
      );

    const input: BulkDeleteEntityInput = {
      sharedIds,
    };

    await sut.execute(input);
    const jobs = await jobsCollection.find().toArray();

    // Should have created jobs for deletion.
    expect(jobs.length).toBe(3);

    const allJobSharedIds = jobs.flatMap((job: any) => job.params.sharedIds);
    expect(allJobSharedIds.sort()).toEqual(sharedIds.sort());

    // Check that jobs are properly chunked
    expect(jobs[0].params.sharedIds.length).toBe(100);
    expect(jobs[1].params.sharedIds.length).toBe(100);
    expect(jobs[2].params.sharedIds.length).toBe(1);
  });

  describe('Permissions', () => {
    let collaboratorId: ObjectId;
    let editorId: ObjectId;
    let group1Id: ObjectId;
    let group2Id: ObjectId;

    beforeAll(() => {
      collaboratorId = factory.id('collaborator');
      editorId = factory.id('editor');
      group1Id = factory.id('group1');
      group2Id = factory.id('group2');
    });

    const fixturesWithPermissions: DBFixture = {
      settings: [
        {
          languages: [
            { default: true, key: 'en', label: 'English' },
            { key: 'es', label: 'Spanish' },
          ],
        },
      ],
      templates: [factory.template('Document A')],
      entities: [
        // Entity with write permission for collaborator (via user)
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_write',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('collaborator', 'user', 'write')],
          }
        ),
        // Entity with read permission only for collaborator (via user)
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_read',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('collaborator', 'user', 'read')],
          }
        ),
        // Entity with write permission for group1
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_group_write',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('group1', 'group', 'write')],
          }
        ),
        // Entity with no permissions for collaborator
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_no_permissions',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('editor', 'user', 'write')],
          }
        ),
        // Published entity (no explicit permissions)
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_published',
          'Document A',
          {},
          {
            published: true,
            permissions: [],
          }
        ),
        // Unpublished entity (no permissions)
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_unpublished_no_permissions',
          'Document A',
          {},
          {
            published: false,
            permissions: [],
          }
        ),
      ],
    };

    beforeEach(async () => {
      await testingEnvironment.setFixtures(fixturesWithPermissions);
      await testingEnvironment.setElastic('bulk_delete_entity_use_case');
    });

    describe('Admin role', () => {
      it('should delete all entities regardless of permissions', async () => {
        const adminUser: UserSchema = {
          _id: new ObjectId(),
          role: 'admin',
          groups: [],
          email: 'admin@test.com',
          username: 'admin',
        } as UserSchema;

        const { sut } = createSut({ actor: adminUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write',
            'entity_with_read',
            'entity_no_permissions',
            'entity_published',
          ],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const deletedIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // All should be deleted from elastic
        expect(deletedIds).not.toContain('entity_with_write');
        expect(deletedIds).not.toContain('entity_with_read');
        expect(deletedIds).not.toContain('entity_no_permissions');
        expect(deletedIds).not.toContain('entity_published');
      });
    });

    describe('Editor role', () => {
      it('should delete all entities regardless of permissions', async () => {
        const editorUser: UserSchema = {
          _id: editorId,
          role: 'editor',
          groups: [],
          email: 'editor@test.com',
          username: 'editor',
        } as UserSchema;

        const { sut } = createSut({ actor: editorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write',
            'entity_with_read',
            'entity_no_permissions',
            'entity_published',
          ],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const deletedIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // All should be deleted from elastic
        expect(deletedIds).not.toContain('entity_with_write');
        expect(deletedIds).not.toContain('entity_with_read');
        expect(deletedIds).not.toContain('entity_no_permissions');
        expect(deletedIds).not.toContain('entity_published');
      });
    });

    describe('Collaborator role', () => {
      it('should only delete entities where collaborator has write permission via user', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_write', 'entity_with_read', 'entity_no_permissions'],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const remainingIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // Only entity_with_write should be deleted
        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
      });

      it('should only delete entities where collaborator has write permission via group', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: group1Id, name: 'group1' }] as any,
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_group_write', 'entity_with_read', 'entity_no_permissions'],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const remainingIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // Only entity_with_group_write should be deleted
        expect(remainingIds).not.toContain('entity_with_group_write');
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
      });

      it('should throw error when trying to delete entities with only read permission', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_read'],
        };

        await expect(sut.execute(input)).rejects.toThrow(
          'You do not have permission to any of the requested entities: entity_with_read'
        );
      });

      it('should throw error when trying to delete published entities without explicit permissions', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_published'],
        };

        await expect(sut.execute(input)).rejects.toThrow(
          'You do not have permission to any of the requested entities: entity_published'
        );
      });

      it('should throw error when trying to delete unpublished entities without permissions', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_unpublished_no_permissions'],
        };

        await expect(sut.execute(input)).rejects.toThrow(
          'You do not have permission to any of the requested entities: entity_unpublished_no_permissions'
        );
      });

      it('should handle mixed permissions - delete only permitted entities', async () => {
        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: group1Id, name: 'group1' }] as any,
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write', // has write via user
            'entity_with_group_write', // has write via group
            'entity_with_read', // only read permission
            'entity_no_permissions', // no permission
            'entity_published', // published but no write permission
          ],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const remainingIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // Only entities with write permission should be deleted
        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).not.toContain('entity_with_group_write');

        // Entities without write permission should remain
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
        expect(remainingIds).toContain('entity_published');
      });

      it('should not create jobs for entities without write permission', async () => {
        const mockedSearch = TestUtils.mockClass<typeof search>({
          bulkDeleteBySharedId: jest.fn().mockResolvedValue(undefined),
        });

        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser, search: mockedSearch });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write', // permitted
            'entity_with_read', // not permitted
            'entity_no_permissions', // not permitted
          ],
        };

        await sut.execute(input);

        const jobs = await jobsCollection.find().toArray();

        // Should only create job for entity_with_write
        expect(jobs).toEqual([
          expect.objectContaining({
            name: 'BulkCleanupEntityJob',
            params: {
              tenantName: tenants.current().name,
              userId: collaboratorUser!._id!.toString(),
              sharedIds: ['entity_with_write'],
            },
          }),
        ]);

        // Search should only be called with permitted entities
        expect(mockedSearch.bulkDeleteBySharedId).toHaveBeenCalledWith(['entity_with_write']);
      });

      it('should throw error when none of the requested entities have write permission', async () => {
        const mockedSearch = TestUtils.mockClass<typeof search>({
          bulkDeleteBySharedId: jest.fn().mockResolvedValue(undefined),
        });

        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser, search: mockedSearch });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_read', // only read permission
            'entity_no_permissions', // no permission
            'entity_published', // published but no write permission
          ],
        };

        await expect(sut.execute(input)).rejects.toThrow(
          'You do not have permission to any of the requested entities: entity_with_read, entity_no_permissions, entity_published'
        );

        const jobs = await jobsCollection.find().toArray();

        // Should not create any jobs
        expect(jobs.length).toBe(0);

        // Search should not be called
        expect(mockedSearch.bulkDeleteBySharedId).not.toHaveBeenCalled();
      });
    });

    describe('Multiple groups', () => {
      it('should delete entities when collaborator has write permission via any of their groups', async () => {
        const entitiesWithMultipleGroups: DBFixture = {
          ...fixturesWithPermissions,
          entities: [
            ...(fixturesWithPermissions.entities || []),
            ...factory.entityInMultipleLanguages(
              ['en', 'es'],
              'entity_group2_write',
              'Document A',
              {},
              {
                permissions: [factory.entityPermission('group2', 'group', 'write')],
              }
            ),
          ],
        };

        await testingEnvironment.setFixtures(entitiesWithMultipleGroups);
        await testingEnvironment.setElastic('bulk_delete_entity_use_case');

        const collaboratorUser: UserSchema = {
          _id: collaboratorId,
          role: 'collaborator',
          groups: [
            { _id: group1Id, name: 'group1' },
            { _id: group2Id, name: 'group2' },
          ] as any,
          email: 'collaborator@test.com',
          username: 'collaborator',
        } as UserSchema;

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_group_write', 'entity_group2_write', 'entity_no_permissions'],
        };

        await sut.execute(input);

        const elasticResult = await elastic.search({ size: 100 });
        const remainingIds = elasticResult.body.hits.hits.map(hit => hit._source.sharedId);

        // Entities with write permission via any group should be deleted
        expect(remainingIds).not.toContain('entity_with_group_write');
        expect(remainingIds).not.toContain('entity_group2_write');

        // Entity without permission should remain
        expect(remainingIds).toContain('entity_no_permissions');
      });
    });
  });
});
