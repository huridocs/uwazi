/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { PDFService } from '#api/core/infrastructure/services/PDFService.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { elastic } from '#api/search/index.js';
import { tenants } from '#api/tenants/index.js';
import { appContext } from '#api/utils/AppContext.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { BulkCleanupEntityUseCase } from '../BulkCleanupEntity.js';
import { FileStorage } from '../contracts/FileStorage.js';
import { FilesService } from '../FilesService.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';

const factory = getFixturesFactory();

const templateA = factory.id('templateA');
const templateB = factory.id('templateB');

const hub1 = factory.hub('hub1', 'sharedId1', [{ entity: 'entity2', template: 'relation_type' }]);
const hub2 = factory.hub('hub2', 'sharedId2', [{ entity: 'entity3', template: 'relation_type' }]);
const hub3 = factory.hub('hub3', 'entity4', [{ entity: 'entity5', template: 'relation_type' }]);

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
    {
      _id: templateA,
      name: 'Template A',
      properties: [
        { _id: factory.id('selectProp'), name: 'selectProp', type: 'select', content: templateB },
        {
          _id: factory.id('relationProp'),
          name: 'relationProp',
          type: 'relationship',
          content: templateB,
        },
      ],
    },
    {
      _id: templateB,
      name: 'Template B',
      properties: [],
    },
  ],

  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'sharedId1', 'templateB', {}),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'sharedId2', 'templateB', {}),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'sharedId3', 'templateB', {}),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity2', 'templateA', {
      selectProp: [{ value: 'sharedId1' }, { value: 'sharedId2' }],
      relationProp: [{ value: 'sharedId3' }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity3', 'templateA', {
      selectProp: [{ value: 'sharedId1' }],
    }),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity4', 'templateB', {}),
  ],

  connections: [...hub1, ...hub2, ...hub3],

  files: [
    factory.file('file_1_sharedId1', {
      entity: 'sharedId1',
      language: 'en',
      mimetype: 'application/pdf',
      type: 'document',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    factory.file('file_2_sharedId1', {
      entity: 'sharedId1',
      language: 'en',
      mimetype: 'application/pdf',
      type: 'document',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    factory.file('file_3_sharedId1', {
      entity: 'sharedId1',
      language: 'en',
      mimetype: 'application/pdf',
      type: 'attachment',
      size: 1000,
      creationDate: 1000,
    }),
    factory.file('file_4_sharedId1', {
      entity: 'sharedId1',
      language: 'en',
      mimetype: 'image/jpeg',
      type: 'thumbnail',
      size: 1000,
      creationDate: 1000,
      filename: `${factory.id('file_2_sharedId1').toHexString()}.jpg`,
    }),
    factory.file('file_1_sharedId5', {
      entity: 'sharedId1',
      language: 'en',
      mimetype: 'image/jpeg',
      type: 'thumbnail',
      size: 1000,
      creationDate: 1000,
      filename: `${factory.id('file_1_sharedId1').toHexString()}.jpg`,
    }),
    factory.file('file_1_sharedId2', {
      entity: 'sharedId2',
      language: 'en',
      mimetype: 'application/pdf',
      type: 'document',
      size: 1000,
      creationDate: 1000,
      status: 'ready',
    }),
    factory.file('file_2_sharedId2', {
      entity: 'sharedId2',
      language: 'en',
      mimetype: 'application/pdf',
      type: 'attachment',
      size: 1000,
      creationDate: 1000,
    }),
    factory.file('file_1_sharedId4', {
      entity: 'sharedId4',
      language: 'en',
      mimetype: 'image/jpeg',
      type: 'thumbnail',
      size: 1000,
      creationDate: 1000,
    }),
  ],
};

type CreateSutProps = {
  filesService?: FilesService;
  relationshipsDS?: MongoRelationshipsV1DataSource;
  entitiesDS?: MongoMultiLanguageEntityDataSource;
};

const createSut = (props?: CreateSutProps) => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const relationshipsDS =
    props?.relationshipsDS ??
    new MongoRelationshipsV1DataSource(getConnection(), transactionManager);
  const entitiesDS = props?.entitiesDS ?? EntitiesDataSourceFactory.forTesting(transactionManager);
  const filesDS = FilesDataSourceFactory.default(transactionManager);

  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });
  const fileStorage = TestUtils.mockClass<FileStorage>({
    removeFile: jest.fn().mockResolvedValue(undefined),
  });
  const filesIO = TestUtils.mockClass<FileContentsIO>({});
  const pdfService = TestUtils.mockClass<PDFService>({});

  const jobsDispatcher = TestUtils.mockClass<Dispatcher>({
    deleteFilesFromStorage: jest.fn().mockResolvedValue(undefined),
    postProcessPDFs: jest.fn().mockResolvedValue(undefined),
    syncRelationships: jest.fn().mockResolvedValue(undefined),
    cleanupEntities: jest.fn().mockResolvedValue(undefined),
    postProcessTemplateEntities: jest
      .fn()
      .mockImplementation(async (callback: (dispatch: jest.Mock) => Promise<void>) => {
        await callback(jest.fn());
      }),
  });

  const filesService =
    props?.filesService ??
    new FilesService({
      pathManager: new PathManager({ tenant: tenants.current() }),
      filesDS,
      fileStorage,
      idGenerator,
      jobsDispatcher,
      pdfService,
      filesIO,
      relV1DS: relationshipsDS,
      transactionManager,
      eventBus,
    });

  const sut = new BulkCleanupEntityUseCase({
    relationshipsDS,
    entitiesDS,
    idGenerator,
    transactionManager,
    eventBus,
    filesService,
  });

  return { sut, eventBus, deleteDispatcher: jobsDispatcher };
};

describe('BulkCleanupEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'delete_entity_use_case');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete relationships hubs', async () => {
    const { sut } = createSut();

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'entity2'],
    };

    // Verify relationships exist before deletion
    const relationsBefore = await testingEnvironment.db.getAllFrom('connections');
    const targetRelationsBefore = relationsBefore.filter((r: any) =>
      input.sharedIds.includes(r.entity)
    );
    expect(targetRelationsBefore.length).toBeGreaterThan(0);

    const result = await sut.execute(input);

    // Verify relationships were deleted
    const relationsAfter = await testingEnvironment.db.getAllFrom('connections');
    const targetRelationsAfter = relationsAfter.filter((r: any) =>
      input.sharedIds.includes(r.entity)
    );
    expect(targetRelationsAfter.length).toBe(0);

    expect(result).toEqual(input);
  });

  it('should delete references to sharedIds on entities collection', async () => {
    const { sut } = createSut();

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    const entitiesBefore = await testingEnvironment.db.getAllFrom('entities');

    await sut.execute(input);

    const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');

    const entity2After = entitiesAfter.filter((e: any) => e.sharedId === 'entity2');
    const entity3After = entitiesAfter.filter((e: any) => e.sharedId === 'entity3');

    expect(entity2After[0]?.metadata.selectProp).toEqual([]);
    expect(entity2After[1]?.metadata.selectProp).toEqual([]);

    expect(entity2After[0]?.metadata.relationProp).toEqual([]);
    expect(entity2After[1]?.metadata.relationProp).toEqual([]);

    expect(entity3After[0]?.metadata.selectProp).toEqual([]);
    expect(entity3After[1]?.metadata.selectProp).toEqual([]);

    // Should not touch unrelated entities
    expect(entitiesBefore.filter(e => e.sharedId === 'entity4')).toEqual(
      entitiesAfter.filter(e => e.sharedId === 'entity4')
    );
  });

  it('should reindex entities that had references to the deleted sharedIds', async () => {
    const { sut } = createSut();

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    await sut.execute(input);
    await elasticTesting.refresh();

    const elasticAfter = await elastic.search({ size: 100 });
    const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');

    const affectedSharedIds = ['entity2', 'entity3'];

    const affectedEntitiesAfter = entitiesAfter.filter(e => affectedSharedIds.includes(e.sharedId));
    const affectedElasticAfter = elasticAfter.body.hits.hits.filter(hit =>
      affectedSharedIds.includes(hit._source.sharedId!)
    );

    expect(affectedElasticAfter).toHaveLength(4);
    expect(affectedEntitiesAfter).toHaveLength(4);

    affectedElasticAfter.forEach(elasticEntity => {
      const dbEntity = affectedEntitiesAfter.find(
        e =>
          e.sharedId === elasticEntity._source.sharedId &&
          e.language === elasticEntity._source.language
      );
      expect(elasticEntity._source.metadata).toEqual(dbEntity?.metadata);
    });
  });

  it('should delete files associated with the deleted entities', async () => {
    testingTenants.changeCurrentTenant({
      uploadedDocuments: '/tenant/uploads',
      attachments: '/tenant/uploads',
    });
    const { sut, deleteDispatcher } = createSut();

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    await sut.execute(input);

    const files = await testingEnvironment.db.getAllFrom('files');

    expect(files).toEqual([
      expect.objectContaining({ _id: factory.id('file_1_sharedId4'), entity: 'sharedId4' }),
    ]);

    expect(deleteDispatcher.deleteFilesFromStorage).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(String)])
    );
    const [paths] = (deleteDispatcher.deleteFilesFromStorage as jest.Mock).mock.calls[0];
    expect(paths).toHaveLength(7);
  });

  it('should emit EntityDeletedEvent for each sharedId', async () => {
    const { sut, eventBus } = createSut();

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    await sut.execute(input);

    expect(eventBus.emit).toHaveBeenCalledTimes(4);

    expect(eventBus.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId1' }] } })
    );
    expect(eventBus.emit).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId2' }] } })
    );
    expect(eventBus.emit).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId3' }] } })
    );
  });

  it('should revert if delete entity files fails', async () => {
    const mockedFilesService = TestUtils.mockClass<FilesService>({
      deleteEntityFiles: jest.fn().mockRejectedValue(new Error('File deletion failed')),
    });

    const { sut } = createSut({ filesService: mockedFilesService });

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    const relationshipsBefore = await testingEnvironment.db.getAllFrom('connections');
    const entitiesBefore = await testingEnvironment.db.getAllFrom('entities');
    const entity2Before = entitiesBefore.filter((e: any) => e.sharedId === 'entity2');

    await expect(sut.execute(input)).rejects.toThrow('File deletion failed');

    const relationshipsAfter = await testingEnvironment.db.getAllFrom('connections');
    expect(relationshipsAfter).toEqual(relationshipsBefore);

    const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');
    const entity2After = entitiesAfter.filter((e: any) => e.sharedId === 'entity2');
    expect(entity2After[0]?.metadata.selectProp).toEqual(entity2Before[0]?.metadata.selectProp);
    expect(entity2After[0]?.metadata.relationProp).toEqual(entity2Before[0]?.metadata.relationProp);

    const filesAfter = await testingEnvironment.db.getAllFrom('files');
    const filesForDeletedEntities = filesAfter.filter((f: any) =>
      input.sharedIds.includes(f.entity)
    );
    expect(filesForDeletedEntities.length).toBeGreaterThan(0);
  });

  it('should revert if deleting relationships fails', async () => {
    const mockedRelationshipsDS = TestUtils.mockClass<MongoRelationshipsV1DataSource>({
      bulkDeleteBySharedId: jest.fn().mockRejectedValue(new Error('Relationships deletion failed')),
      deleteByFiles: jest.fn().mockRejectedValue(new Error('Relationships deletion failed')),
    });

    const { sut } = createSut({ relationshipsDS: mockedRelationshipsDS });

    const input = {
      sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
    };

    await expect(sut.execute(input)).rejects.toThrow('Relationships deletion failed');

    const relationshipsAfter = await testingEnvironment.db.getAllFrom('connections');
    const relationshipsForDeletedEntities = relationshipsAfter.filter((r: any) =>
      input.sharedIds.includes(r.entity)
    );
    expect(relationshipsForDeletedEntities.length).toBeGreaterThan(0);

    const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');
    const entity2After = entitiesAfter.filter((e: any) => e.sharedId === 'entity2');
    expect(entity2After[0]?.metadata.selectProp).toEqual([
      { value: 'sharedId1' },
      { value: 'sharedId2' },
    ]);
    expect(entity2After[0]?.metadata.relationProp).toEqual([{ value: 'sharedId3' }]);
  });

  it('should revert if deleting references on entities fails', async () => {
    await appContext.run(async () => {
      const mockedEntitiesDS = TestUtils.mockClass<MongoMultiLanguageEntityDataSource>({
        deleteReferencesToSharedIds: jest
          .fn()
          .mockRejectedValue(new Error('Reference deletion failed')),
      });

      const { sut } = createSut({ entitiesDS: mockedEntitiesDS });

      const input = {
        sharedIds: ['sharedId1', 'sharedId2', 'sharedId3'],
      };

      const relationshipsBefore = await testingEnvironment.db.getAllFrom('connections');
      const entitiesBefore = await testingEnvironment.db.getAllFrom('entities');
      const entity2Before = entitiesBefore.filter((e: any) => e.sharedId === 'entity2');

      await expect(sut.execute(input)).rejects.toThrow('Reference deletion failed');

      const relationshipsAfter = await testingEnvironment.db.getAllFrom('connections');
      expect(relationshipsAfter).toEqual(relationshipsBefore);

      const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');
      const entity2After = entitiesAfter.filter((e: any) => e.sharedId === 'entity2');
      expect(entity2After[0]?.metadata.selectProp).toEqual(entity2Before[0]?.metadata.selectProp);
      expect(entity2After[0]?.metadata.relationProp).toEqual(
        entity2Before[0]?.metadata.relationProp
      );
    });
  });

  it('should throw when input is invalid', async () => {
    const { sut } = createSut();

    // These should throw validation errors from Zod
    await expect(sut.execute({ sharedIds: null } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedIds: [] } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedIds: [''] } as any)).rejects.toThrow();
    await expect(sut.execute({ sharedIds: ['  '] } as any)).rejects.toThrow();
    await expect(
      sut.execute({
        sharedIds: Array(101).fill('id'),
      } as any)
    ).rejects.toThrow();
    await expect(sut.execute({} as any)).rejects.toThrow();
  });
});
