import { ObjectId } from 'mongodb';

import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoExtractorBuilder } from 'api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder';
import {
  mongoPXExtractorsCollection,
  MongoPXExtractorsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { PXEntitiesStatusDataSourceFactory } from 'api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import entitiesDS from 'api/entities';

import { PXEntityStatusManager } from '../PXEntityStatusManager';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const template = factory.template('template');

const entity = factory.entity('entity', sourceTemplate.name);
const entity2 = factory.entity('entity_that_does_not_belong_to_extractor', template.name);

const createFixtures = (): DBFixture => ({
  entities: [entity, entity2],
  templates: [targetTemplate, sourceTemplate],
  [mongoPXExtractorsCollection]: [extractor],
  relationtypes: [sourceRelationship, targetRelationship],
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
});

const setUpUseCase = () => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();
  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);
  const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);

  const entityStatusManager = new PXEntityStatusManager({
    entitiesDS,
    entitiesStatusDS,
    settingsDS,
    extractorsDS,
  });

  return {
    entityStatusManager,
  };
};

// eslint-disable-next-line max-statements
describe('PXEntityStatusManager', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create EntityStatus when a Document is processed', async () => {
    const { entityStatusManager } = setUpUseCase();

    await entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'processing',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'en',
        status: 'ready',
      },
    });

    const entitiesStatus = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        status: EntityStatus.New,
        extractorId: extractor._id,
        entitySharedId: entity.sharedId,
      },
    ]);
  });

  it('should change EntityStatus to obsolete', async () => {
    const mongoEntityStatus: MongoPXEntityStatusDBO = {
      _id: factory.id('entity_status'),
      entitySharedId: entity.sharedId!,
      extractorId: extractor._id,
      status: EntityStatus.Processed,
    };

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
    });

    const { entityStatusManager } = setUpUseCase();

    await entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'pt',
        status: 'ready',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'en',
        status: 'ready',
      },
    });

    const entitiesStatus = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        status: EntityStatus.Obsolete,
        extractorId: extractor._id,
        entitySharedId: entity.sharedId,
      },
    ]);
  });

  it('should keep EntityStatus to New', async () => {
    const mongoEntityStatus: MongoPXEntityStatusDBO = {
      _id: factory.id('entity_status'),
      entitySharedId: entity.sharedId!,
      extractorId: extractor._id,
      status: EntityStatus.New,
    };

    await testingEnvironment.setFixtures({
      ...createFixtures(),
      [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
    });

    const { entityStatusManager } = setUpUseCase();

    await entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'pt',
        status: 'ready',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'en',
        status: 'ready',
      },
    });

    const entitiesStatus = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        status: EntityStatus.New,
        extractorId: extractor._id,
        entitySharedId: entity.sharedId,
      },
    ]);
  });

  it('should throw if the File is not a Document', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'custom',
        entity: entity.sharedId!,
        status: 'processing',
      },
      after: {
        type: 'custom',
        entity: entity.sharedId!,
        language: 'en',
        status: 'ready',
      },
    });

    await expect(promise).rejects.toThrow();
  });

  it('should throw if is not a processed Document', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'processing',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        language: 'en',
        status: 'failed',
      },
    });

    await expect(promise).rejects.toThrow();
  });

  it('should throw if there is no change on the Document language', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'ready',
        language: 'en',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'ready',
        language: 'en',
      },
    });

    await expect(promise).rejects.toThrow();
  });

  it('should throw if source Entity does not exist', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'document',
        entity: 'any_source_entity',
        status: 'ready',
        language: 'en',
      },
      after: {
        type: 'document',
        entity: 'any_source_entity',
        status: 'ready',
        language: 'pt',
      },
    });

    await expect(promise).rejects.toThrow();
  });

  it('should throw if Document language does not belongs to UI Languages', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'ready',
        language: 'en',
      },
      after: {
        type: 'document',
        entity: entity.sharedId!,
        status: 'ready',
        language: 'pt',
      },
    });

    await expect(promise).rejects.toThrow();
  });

  it('should throw if source Entity does not match with the Extractor source Template', async () => {
    const { entityStatusManager } = setUpUseCase();

    const promise = entityStatusManager.execute({
      before: {
        type: 'document',
        entity: entity2.sharedId!,
        status: 'processing',
      },
      after: {
        type: 'document',
        entity: entity2.sharedId!,
        status: 'ready',
        language: 'en',
      },
    });

    await expect(promise).rejects.toThrow();
  });
});
