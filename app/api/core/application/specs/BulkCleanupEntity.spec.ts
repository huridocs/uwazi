/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TestUtils } from 'api/common.v2/utils/Test';
import { EventsBus } from 'api/core/libs/eventsbus';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { BulkCleanupEntityUseCase } from '../BulkCleanupEntity';

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
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });
  const relationshipsDS = new MongoRelationshipsV1DataSource(getConnection(), transactionManager);
  const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

  const sut = new BulkCleanupEntityUseCase({
    relationshipsDS,
    entitiesDS,
    idGenerator,
    transactionManager,
    eventBus,
  });

  return { sut, eventBus };
};

describe('BulkCleanupEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'delete_entity_use_case');
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
    await testingEnvironment.setElastic('delete_entity_use_case');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete relationships hubs', async () => {
    const { sut } = createSut();

    const input = {
      deleteEntities: [
        { sharedId: 'sharedId1', templateId: templateB.toString() },
        { sharedId: 'sharedId2', templateId: templateB.toString() },
        { sharedId: 'entity2', templateId: templateA.toString() },
      ],
    };

    // Verify relationships exist before deletion
    const relationsBefore = await testingEnvironment.db.getAllFrom('connections');
    const sharedIds = input.deleteEntities.map(e => e.sharedId);
    const targetRelationsBefore = relationsBefore.filter((r: any) => sharedIds.includes(r.entity));
    expect(targetRelationsBefore.length).toBeGreaterThan(0);

    const result = await sut.execute(input);

    // Verify relationships were deleted
    const relationsAfter = await testingEnvironment.db.getAllFrom('connections');
    const targetRelationsAfter = relationsAfter.filter((r: any) => sharedIds.includes(r.entity));
    expect(targetRelationsAfter.length).toBe(0);

    expect(result).toEqual(input);
  });

  it('should delete references to sharedIds on entities collection', async () => {
    const { sut } = createSut();

    const input = {
      deleteEntities: [
        { sharedId: 'sharedId1', templateId: templateB.toString() },
        { sharedId: 'sharedId2', templateId: templateB.toString() },
        { sharedId: 'sharedId3', templateId: templateB.toString() },
      ],
    };

    // Verify references exist before deletion
    const entitiesBefore = await testingEnvironment.db.getAllFrom('entities');
    const entity2Before = entitiesBefore.find(
      (e: any) => e.sharedId === 'entity2' && e.language === 'en'
    );
    const entity3Before = entitiesBefore.find(
      (e: any) => e.sharedId === 'entity3' && e.language === 'en'
    );

    // entity2 has multiple deleted sharedIds: sharedId1 and sharedId2 in selectProp, sharedId3 in relationProp
    expect(entity2Before?.metadata.selectProp).toEqual([
      { value: 'sharedId1' },
      { value: 'sharedId2' },
    ]);
    expect(entity2Before?.metadata.relationProp).toEqual([{ value: 'sharedId3' }]);
    expect(entity3Before?.metadata.selectProp).toEqual([{ value: 'sharedId1' }]);

    await sut.execute(input);

    // Verify all references to all three deleted sharedIds were removed
    const entitiesAfter = await testingEnvironment.db.getAllFrom('entities');
    const entity2After = entitiesAfter.find(
      (e: any) => e.sharedId === 'entity2' && e.language === 'en'
    );
    const entity3After = entitiesAfter.find(
      (e: any) => e.sharedId === 'entity3' && e.language === 'en'
    );

    expect(entity2After?.metadata.selectProp).toEqual([]);
    expect(entity2After?.metadata.relationProp).toEqual([]);
    expect(entity3After?.metadata.selectProp).toEqual([]);

    // Verify other entities are not affected
    const entity4After = entitiesAfter.find((e: any) => e.sharedId === 'entity4');
    expect(entity4After).toBeDefined();
  });

  it('should emit EntityDeletedEvent for each sharedId', async () => {
    const { sut, eventBus } = createSut();

    const input = {
      deleteEntities: [
        { sharedId: 'sharedId1', templateId: templateB.toString() },
        { sharedId: 'sharedId2', templateId: templateB.toString() },
        { sharedId: 'sharedId3', templateId: templateB.toString() },
      ],
    };

    await sut.execute(input);

    expect(eventBus.emit).toHaveBeenCalledTimes(3);
    expect(eventBus.emit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId1' }] } })
    );
    expect(eventBus.emit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId2' }] } })
    );
    expect(eventBus.emit).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ data: { entity: [{ sharedId: 'sharedId3' }] } })
    );
  });

  it('should throw when input is invalid', async () => {
    const { sut } = createSut();

    // These should throw validation errors from Zod
    await expect(sut.execute({ deleteEntities: null } as any)).rejects.toThrow();
    await expect(sut.execute({ deleteEntities: [] } as any)).rejects.toThrow();
    await expect(
      sut.execute({ deleteEntities: [{ sharedId: 'id', templateId: null }] } as any)
    ).rejects.toThrow();
    await expect(
      sut.execute({ deleteEntities: [{ sharedId: '', templateId: 'test' }] } as any)
    ).rejects.toThrow();
    await expect(
      sut.execute({
        deleteEntities: Array(101).fill({ sharedId: 'id', templateId: 'test' }),
      } as any)
    ).rejects.toThrow();
    await expect(sut.execute({} as any)).rejects.toThrow();
  });
});
