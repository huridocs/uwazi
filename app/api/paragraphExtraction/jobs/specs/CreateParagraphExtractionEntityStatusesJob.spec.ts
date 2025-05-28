/* eslint-disable max-statements */
import { Db, WithId } from 'mongodb';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import {
  CreateParagraphExtractionEntityStatusesJob,
  CreateParagraphExtractionEntityStatusesJobParams,
} from 'api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { NonRetryableJobError } from 'api/queue.v2/infrastructure/errors';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
import { DBFixture } from 'api/utils/testing_db';
import { ConnectionSchema } from 'shared/types/connectionType';
import { TemplateSchema } from 'shared/types/templateType';

const f = getFixturesFactory();

const TEST_SPECIFIC_BATCH_SIZE = 2;

const sourceTemplate = f.template('Source Template', [f.property('text', 'text')]);
const targetTemplate = f.template('Target Template', [
  f.property('paragraphProperty', 'markdown'),
  f.property('paragraphNumberProperty', 'numeric'),
]);

const sourceRelationshipType = {
  _id: f.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: f.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const nonRelevantRelationshipType = {
  _id: f.id('nonRelevantRelationshipType'),
  name: 'Other Relationship Type',
  properties: [],
};

const extractorId = f.id('extractor1');
const extractor1 = {
  _id: extractorId,
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphPropertyId: targetTemplate.properties![0]._id,
  paragraphNumberPropertyId: targetTemplate.properties![1]._id,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const createBaseFixtures = (): DBFixture => ({
  templates: [sourceTemplate, targetTemplate],
  relationtypes: [sourceRelationshipType, targetRelationshipType, nonRelevantRelationshipType],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
  px_extractors: [extractor1],
  entities: [],
  files: [],
  connections: [],
});

const setUpJob = (db: Db, mockDispatcher: JobsDispatcher, batchSize?: number) => {
  const connection = getConnection();
  const transactionManager = DefaultTransactionManager();
  const settingsDS = DefaultSettingsDataSource(transactionManager);
  const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
    connection,
    transactionManager,
  });
  const pxEntitiesStatusDS = new MongoPXEntitiesStatusDataSource(
    db,
    transactionManager,
    settingsDS,
    extractorsQueryService
  );

  return new CreateParagraphExtractionEntityStatusesJob(
    {
      db,
      settingsDS,
      extractorsQueryService,
      pxEntitiesStatusDS,
      dispatcher: mockDispatcher,
    },
    batchSize
  );
};

// Helper to simulate heartbeat
const mockHeartbeat = async () => Promise.resolve();

describe('CreateParagraphExtractionEntityStatusesJob', () => {
  let db: Db;
  let mockDispatcher: jest.Mocked<JobsDispatcher>;

  beforeEach(async () => {
    await testingEnvironment.setUp(createBaseFixtures());
    db = getConnection();
    mockDispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const prepareDataWithFiles = async (
    numEntities: number,
    fileLangSetup: ('en' | 'es' | 'pt' | null)[]
  ) => {
    const entities: EntitySchema[] = [];
    const files: WithId<FileType>[] = [];

    for (let i = 0; i < numEntities; i += 1) {
      const [entityEn, entityEs] = f.entityInMultipleLanguages(
        ['en', 'es'],
        `entity${i}`,
        sourceTemplate.name
      );
      entities.push(entityEn, entityEs);
      if (fileLangSetup[i]) {
        files.push(
          f.document(`doc_entity${i}`, { entity: entityEn.sharedId, language: fileLangSetup[i]! })
        );
      }
    }

    await testingEnvironment.setFixtures({
      ...createBaseFixtures(),
      entities: [...createBaseFixtures().entities!, ...entities],
      files: [...createBaseFixtures().files!, ...files],
    });

    return { entities, files };
  };

  const prepareDataWithRelationships = async (
    baseEntities: EntitySchema[],
    files: WithId<FileType>[],
    relationshipSetups: { entityIndex: number; hasRelationship: boolean }[]
  ) => {
    const relationships: ConnectionSchema[] = [];
    const paragraphEntities: EntitySchema[] = [];

    relationshipSetups.forEach(setup => {
      if (setup.hasRelationship) {
        const languageParagraphEntities = f.entityInMultipleLanguages(
          ['en', 'es'],
          `paragraph_for_${baseEntities[setup.entityIndex].sharedId}`,
          targetTemplate.name
        );
        paragraphEntities.push(...languageParagraphEntities);

        const [hubConnection, spokeConnection] = f.bidirectionalHub(
          `hub_for_${baseEntities[setup.entityIndex].sharedId}`,
          {
            entity: baseEntities[setup.entityIndex].sharedId!,
            template: 'sourceRelationshipType',
          },
          [
            {
              entity: languageParagraphEntities[0].sharedId!,
              template: 'targetRelationshipType',
            },
          ]
        );
        relationships.push(hubConnection, spokeConnection);
      }
    });

    await testingEnvironment.setFixtures({
      ...createBaseFixtures(),
      entities: [...createBaseFixtures().entities!, ...baseEntities, ...paragraphEntities],
      files: [...createBaseFixtures().files!, ...files],
      connections: [...createBaseFixtures().connections!, ...relationships],
    });
  };

  it('should throw NonRetryableJobError if no languages are installed', async () => {
    await testingEnvironment.setFixtures({ settings: [{ languages: [] }] });
    const job = setUpJob(db, mockDispatcher);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };
    await expect(job.handleDispatch(mockHeartbeat, params)).rejects.toThrow(NonRetryableJobError);
  });

  it('should throw NonRetryableJobError if no default language is configured', async () => {
    await testingEnvironment.setFixtures({
      settings: [{ languages: [{ key: 'en', label: 'English' }] }],
    });
    const job = setUpJob(db, mockDispatcher);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };
    await expect(job.handleDispatch(mockHeartbeat, params)).rejects.toThrow(NonRetryableJobError);
  });

  it('should process entities in batches and re-dispatch if a full batch is processed', async () => {
    // 3 entities, first two have 'en' files, third has 'es' (will be processed due to UI lang)
    // Batch size is 2. Expect 2 processed, 1 re-dispatch.
    const { entities, files } = await prepareDataWithFiles(3, ['en', 'en', 'es']);
    await prepareDataWithRelationships(entities, files, [
      { entityIndex: 0, hasRelationship: true }, // entity0 -> Processed
      { entityIndex: 1, hasRelationship: false }, // entity1 -> New
    ]);

    const enEntities = entities.filter(e => e.language === 'en');

    const job = setUpJob(db, mockDispatcher, TEST_SPECIFIC_BATCH_SIZE);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };

    await job.handleDispatch(mockHeartbeat, params);

    const statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(TEST_SPECIFIC_BATCH_SIZE);
    expect(statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entitySharedId: enEntities[0].sharedId,
          status: EntityStatus.Processed,
        }),
        expect.objectContaining({
          entitySharedId: enEntities[1].sharedId,
          status: EntityStatus.New,
        }),
      ])
    );
    expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatcher.dispatch).toHaveBeenCalledWith(
      CreateParagraphExtractionEntityStatusesJob,
      params
    );
  });

  it('should process remaining entities in the next run and not re-dispatch if batch is not full', async () => {
    // 3 entities. Entity0 and Entity1 will have 'en' docs, Entity2 'es' doc.
    const { entities, files } = await prepareDataWithFiles(3, ['en', 'en', 'es']);
    // Entity0 has relationship (Processed), Entity1 no relationship (New), Entity2 no relationship (New)
    await prepareDataWithRelationships(entities, files, [
      { entityIndex: 0, hasRelationship: true },
    ]);

    const enEntities = entities.filter(e => e.language === 'en');

    const job = setUpJob(db, mockDispatcher, TEST_SPECIFIC_BATCH_SIZE);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };

    // Simulate first run (processes 2, re-dispatches)
    await job.handleDispatch(mockHeartbeat, params);
    let statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(TEST_SPECIFIC_BATCH_SIZE);
    expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(1);

    // Simulate second run (processes remaining 1)
    // Clear mock for the second call check
    mockDispatcher.dispatch.mockClear();
    // Create new job instance to simulate a fresh run from the queue, it will pick up where left
    const job2 = setUpJob(db, mockDispatcher, TEST_SPECIFIC_BATCH_SIZE);
    await job2.handleDispatch(mockHeartbeat, params);

    statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(3); // All 3 processed
    expect(statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entitySharedId: enEntities[0].sharedId,
          status: EntityStatus.Processed,
        }),
        expect.objectContaining({
          entitySharedId: enEntities[1].sharedId,
          status: EntityStatus.New,
        }),
        expect.objectContaining({
          entitySharedId: enEntities[2].sharedId,
          status: EntityStatus.New,
        }),
      ])
    );
    expect(mockDispatcher.dispatch).not.toHaveBeenCalled(); // No re-dispatch
  });

  it('should correctly determine status "New" or "Processed"', async () => {
    const { entities, files } = await prepareDataWithFiles(2, ['en', 'en']); // 2 entities with 'en' files
    // entity0 has relationship -> Processed
    // entity1 has no relationship -> New
    await prepareDataWithRelationships(entities, files, [
      { entityIndex: 0, hasRelationship: true },
    ]);

    const enEntities = entities.filter(e => e.language === 'en');

    const job = setUpJob(db, mockDispatcher, TEST_SPECIFIC_BATCH_SIZE);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };

    await job.handleDispatch(mockHeartbeat, params);

    const statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(TEST_SPECIFIC_BATCH_SIZE);
    expect(statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entitySharedId: enEntities[0].sharedId,
          status: EntityStatus.Processed,
          extractorId,
        }),
        expect.objectContaining({
          entitySharedId: enEntities[1].sharedId,
          status: EntityStatus.New,
          extractorId,
        }),
      ])
    );
    expect(mockDispatcher.dispatch).toHaveBeenCalledTimes(1); // Batch was full, so dispatch is expected

    // Simulate the re-dispatched job
    mockDispatcher.dispatch.mockClear();
    const job2 = setUpJob(db, mockDispatcher, TEST_SPECIFIC_BATCH_SIZE);
    await job2.handleDispatch(mockHeartbeat, params);

    // No new entities should have been processed, so no further dispatch
    const statusesAfterSecondCall = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statusesAfterSecondCall).toHaveLength(TEST_SPECIFIC_BATCH_SIZE); // Still the same 2 statuses
    expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should not process entities that do not have a file in any of the installed UI languages', async () => {
    // entity0 has 'pt' file (non-UI default, but installed), entity1 has no file
    const { entities } = await prepareDataWithFiles(2, ['pt', null]);

    const enEntities = entities.filter(e => e.language === 'en');

    const job = setUpJob(db, mockDispatcher);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };

    await job.handleDispatch(mockHeartbeat, params);
    const statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(1); // Only entity0
    expect(statuses[0].entitySharedId).toBe(enEntities[0].sharedId);
    expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should do nothing if no entities match the criteria', async () => {
    // Add a source template that won't be used by any entity
    const otherSourceTemplate = f.template('Other Source Template');
    await testingEnvironment.setFixtures({
      ...createBaseFixtures(),
      templates: [otherSourceTemplate as TemplateSchema],
    });

    const job = setUpJob(db, mockDispatcher);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: otherSourceTemplate._id.toString(), // Use a template with no entities
    };

    await job.handleDispatch(mockHeartbeat, params);

    const statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    expect(statuses).toHaveLength(0);
    expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should not re-process entities that already have a status for the given extractor', async () => {
    const { entities } = await prepareDataWithFiles(1, ['en']);

    const enEntities = entities.filter(e => e.language === 'en');

    // Pre-create a status for this entity and extractor
    await testingEnvironment.setFixtures({
      ...createBaseFixtures(),
      ...entities,
      [mongoPXEntitiesStatusCollection]: [
        {
          _id: f.id('preexisting_status'),
          extractorId,
          entitySharedId: enEntities[0].sharedId,
          status: EntityStatus.New,
          creationDate: new Date(),
        },
      ],
    });

    const job = setUpJob(db, mockDispatcher);
    const params: CreateParagraphExtractionEntityStatusesJobParams = {
      extractorId: extractorId.toString(),
      sourceTemplateId: sourceTemplate._id.toString(),
    };

    await job.handleDispatch(mockHeartbeat, params);

    const statuses = (await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    ))! as MongoPXEntityStatusDBO[];
    // Should still only be the one pre-existing status, no new one created
    expect(statuses).toHaveLength(1);
    expect(statuses[0].entitySharedId).toBe(enEntities[0].sharedId);
    expect(mockDispatcher.dispatch).not.toHaveBeenCalled();
  });
});
