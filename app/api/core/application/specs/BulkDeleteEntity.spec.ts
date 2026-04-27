/* eslint-disable max-statements */
import { Collection, ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { tenants } from '#api/tenants/index.js';
import { search } from '#api/search/index.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { User } from '#api/users.v2/model/User.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { BulkDeleteEntityUseCaseFactory } from '#api/core/infrastructure/factories/BulkDeleteEntityUseCaseFactory.js';
import { BulkDeleteEntityInput } from '../BulkDeleteEntity.js';

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
        en: { title: 'Document A1 EN' },
        es: { title: 'Document A1 ES' },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'A2',
      'Document A',
      {},
      { title: 'A2' },
      {
        en: { title: 'Document A2 EN' },
        es: { title: 'Document A2 ES' },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'B1',
      'Document B',
      {},
      { title: 'B1' },
      {
        en: { title: 'Document B1 EN' },
        es: { title: 'Document B1 ES' },
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'C1',
      'Document C',
      {},
      { title: 'C1' },
      {
        en: { title: 'Document C1 EN' },
        es: { title: 'Document C1 ES' },
      }
    ),
  ],
};

type CreateSutProps = {
  dispatcher?: JobsDispatcher;
  actor?: User;
  entitiesDS?: MultiLanguageEntityDataSource;
};

const createSut = (props?: CreateSutProps) => {
  const actor =
    props?.actor ??
    User.createFrom({ _id: new ObjectId(), role: 'admin', groups: [], email: '', username: '' });

  const { sut } = testingEnvironment.runWithContext(
    () => ({
      sut: BulkDeleteEntityUseCaseFactory.default({
        ...(props?.entitiesDS !== undefined ? { entitiesDS: props.entitiesDS } : {}),
      }),
    }),
    {
      actor,
      ...(props?.dispatcher
        ? { factories: { jobsDispatcher: () => props.dispatcher! } }
        : undefined),
    }
  );

  return { sut, actor };
};

describe('BulkDeleteEntityUseCase', () => {
  let jobsCollection: Collection;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);

    jobsCollection = getConnection().collection('jobs');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await jobsCollection.deleteMany({});
  });

  afterAll(async () => {
    await jobsCollection.deleteMany({});
    await testingEnvironment.tearDown();
  });

  it('should delete entities', async () => {
    const { sut, actor } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    const result = await sut.execute(input);

    expect(result.deletedSharedIds.sort()).toEqual(['A1', 'A2', 'B1']);

    const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
    const jobs = await jobsCollection.find().toArray();

    const dbSharedIds = entitiesDB.map((entity: any) => entity.sharedId);
    expect(dbSharedIds).not.toContain(['A1', 'A2', 'B1']);
    expect(dbSharedIds).toEqual(['C1', 'C1']);

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
  });

  it('should revert when search deletion fails', async () => {
    const spy = jest
      .spyOn(search, 'bulkDeleteBySharedId')
      .mockRejectedValue(new Error('Deletion failed'));

    const { sut } = createSut();

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

    spy.mockRestore();
  });

  it('should revert when dispatching of jobs fails', async () => {
    const dispatcher = TestUtils.mockClass<JobsDispatcher>({
      dispatchMany: jest.fn().mockRejectedValue(new Error('Dispatch failed')),
    });

    const { sut } = createSut({ dispatcher });

    const entitiesDBBefore = await testingEnvironment.db.getAllFrom('entities');

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Dispatch failed');

    const entitiesDBAfter = await testingEnvironment.db.getAllFrom('entities');

    expect(entitiesDBBefore).toEqual(entitiesDBAfter);
  });

  it('should revert when deletion of entities on db fails', async () => {
    const entitiesDS = TestUtils.mockClass<MultiLanguageEntityDataSource>({
      bulkDelete: jest.fn().mockRejectedValue(new Error('Fail')),
    });

    const { sut } = createSut({ entitiesDS });

    const jobsBefore = await jobsCollection.find().toArray();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'B1'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Fail');

    const jobsAfter = await jobsCollection.find().toArray();

    expect(jobsBefore).toEqual(jobsAfter);
  });

  it('should handle entities that do not exist gracefully', async () => {
    const spy = jest.spyOn(search, 'bulkDeleteBySharedId').mockResolvedValue(undefined);

    const { sut } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['NON_EXISTENT_ID_1', 'NON_EXISTENT_ID_2', 'A1'],
    };

    await sut.execute(input);

    expect(spy).toHaveBeenCalledWith(['A1']);

    spy.mockRestore();
  });

  it('should deduplicate sharedIds before processing', async () => {
    const spy = jest.spyOn(search, 'bulkDeleteBySharedId').mockResolvedValue(undefined);

    const { sut } = createSut();

    const input: BulkDeleteEntityInput = {
      sharedIds: ['A1', 'A2', 'A1', 'B1', 'A2'],
    };

    await sut.execute(input);

    expect(spy).toHaveBeenCalledWith(expect.arrayContaining(['A1', 'A2', 'B1']));

    spy.mockRestore();
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

    expect(jobs.length).toBe(3);

    const allJobSharedIds = jobs.flatMap((job: any) => job.params.sharedIds);
    expect(allJobSharedIds.sort()).toEqual(sharedIds.sort());

    expect(jobs[0].params.sharedIds.length).toBe(100);
    expect(jobs[1].params.sharedIds.length).toBe(100);
    expect(jobs[2].params.sharedIds.length).toBe(1);
  });

  describe('Permissions', () => {
    let collaboratorId: ObjectId;
    let group1Id: ObjectId;
    let group2Id: ObjectId;

    beforeAll(() => {
      collaboratorId = factory.id('collaborator');
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
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_write',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('collaborator', 'user', 'write')],
          }
        ),
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_read',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('collaborator', 'user', 'read')],
          }
        ),
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_with_group_write',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('group1', 'group', 'write')],
          }
        ),
        ...factory.entityInMultipleLanguages(
          ['en', 'es'],
          'entity_no_permissions',
          'Document A',
          {},
          {
            permissions: [factory.entityPermission('editor', 'user', 'write')],
          }
        ),
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
    });

    describe('Admin role', () => {
      it('should delete all entities regardless of permissions', async () => {
        const adminUser = User.createFrom({
          _id: new ObjectId(),
          role: 'admin',
          groups: [],
        });

        const { sut } = createSut({ actor: adminUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write',
            'entity_with_read',
            'entity_no_permissions',
            'entity_published',
          ],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds.sort()).toEqual([
          'entity_no_permissions',
          'entity_published',
          'entity_with_read',
          'entity_with_write',
        ]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).not.toContain('entity_with_read');
        expect(remainingIds).not.toContain('entity_no_permissions');
        expect(remainingIds).not.toContain('entity_published');
      });
    });

    describe('Editor role', () => {
      it('should delete all entities regardless of permissions', async () => {
        const editorUser = User.createFrom({
          _id: factory.id('editor'),
          role: 'editor',
          groups: [],
        });

        const { sut } = createSut({ actor: editorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write',
            'entity_with_read',
            'entity_no_permissions',
            'entity_published',
          ],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds.sort()).toEqual([
          'entity_no_permissions',
          'entity_published',
          'entity_with_read',
          'entity_with_write',
        ]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).not.toContain('entity_with_read');
        expect(remainingIds).not.toContain('entity_no_permissions');
        expect(remainingIds).not.toContain('entity_published');
      });
    });

    describe('Collaborator role', () => {
      it('should only delete entities where collaborator has write permission via user', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_write', 'entity_with_read', 'entity_no_permissions'],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds).toEqual(['entity_with_write']);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
      });

      it('should only delete entities where collaborator has write permission via group', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: group1Id }],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_group_write', 'entity_with_read', 'entity_no_permissions'],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds).toEqual(['entity_with_group_write']);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_group_write');
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
      });

      it('should not delete entities where collaborator only has read permission', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const result = await sut.execute({ sharedIds: ['entity_with_read'] });

        expect(result.deletedSharedIds).toEqual([]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        expect(entitiesDB.map((e: any) => e.sharedId)).toContain('entity_with_read');
      });

      it('should not delete published entities without explicit write permissions', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const result = await sut.execute({ sharedIds: ['entity_published'] });

        expect(result.deletedSharedIds).toEqual([]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        expect(entitiesDB.map((e: any) => e.sharedId)).toContain('entity_published');
      });

      it('should not delete unpublished entities without permissions', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const result = await sut.execute({ sharedIds: ['entity_unpublished_no_permissions'] });

        expect(result.deletedSharedIds).toEqual([]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        expect(entitiesDB.map((e: any) => e.sharedId)).toContain(
          'entity_unpublished_no_permissions'
        );
      });

      it('should handle mixed permissions - delete only permitted entities', async () => {
        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: group1Id }],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: [
            'entity_with_write',
            'entity_with_group_write',
            'entity_with_read',
            'entity_no_permissions',
            'entity_published',
          ],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds.sort()).toEqual([
          'entity_with_group_write',
          'entity_with_write',
        ]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_write');
        expect(remainingIds).not.toContain('entity_with_group_write');
        expect(remainingIds).toContain('entity_with_read');
        expect(remainingIds).toContain('entity_no_permissions');
        expect(remainingIds).toContain('entity_published');
      });

      it('should not create jobs for entities without write permission', async () => {
        const spy = jest.spyOn(search, 'bulkDeleteBySharedId').mockResolvedValue(undefined);

        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_write', 'entity_with_read', 'entity_no_permissions'],
        };

        await sut.execute(input);

        const jobs = await jobsCollection.find().toArray();

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

        expect(spy).toHaveBeenCalledWith(['entity_with_write']);

        spy.mockRestore();
      });

      it('should do nothing when none of the requested entities have write permission', async () => {
        const spy = jest.spyOn(search, 'bulkDeleteBySharedId').mockResolvedValue(undefined);

        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_read', 'entity_no_permissions', 'entity_published'],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds).toEqual([]);

        const jobs = await jobsCollection.find().toArray();

        expect(jobs.length).toBe(0);
        expect(spy).not.toHaveBeenCalled();

        spy.mockRestore();
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

        const collaboratorUser = User.createFrom({
          _id: collaboratorId,
          role: 'collaborator',
          groups: [{ _id: group1Id }, { _id: group2Id }],
        });

        const { sut } = createSut({ actor: collaboratorUser });

        const input: BulkDeleteEntityInput = {
          sharedIds: ['entity_with_group_write', 'entity_group2_write', 'entity_no_permissions'],
        };

        const result = await sut.execute(input);

        expect(result.deletedSharedIds.sort()).toEqual([
          'entity_group2_write',
          'entity_with_group_write',
        ]);

        const entitiesDB = await testingEnvironment.db.getAllFrom('entities');
        const remainingIds = entitiesDB.map((e: any) => e.sharedId);

        expect(remainingIds).not.toContain('entity_with_group_write');
        expect(remainingIds).not.toContain('entity_group2_write');
        expect(remainingIds).toContain('entity_no_permissions');
      });
    });
  });
});
