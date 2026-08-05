/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { MongoExtractorBuilder } from '#api/paragraphExtraction/infrastructure/specs/MongoPXExtractorBuilder.js';
import { mongoPXExtractorsCollection } from '#api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource.js';
import { mongoPXEntitiesStatusCollection } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { MongoPXEntityStatusDBO } from '#api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';

import { PXEntityStatusManagerFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusManagerFactory.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

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

const createSut = () =>
  testingEnvironment.runWithContext(() => {
    const entityStatusManager = PXEntityStatusManagerFactory.createDefault();

    return {
      entityStatusManager,
    };
  });

describe('PXEntityStatusManager', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(createFixtures(), { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(createFixtures());
    });

    it('should create EntityStatus when a Document is processed', async () => {
      const { entityStatusManager } = createSut();

      await entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'processing',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          language: 'en',
          status: 'ready',
        },
      });

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

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

      const documentEn = factory.document('document_en', {
        _id: new ObjectId(),
        language: 'en',
        entity: entity.sharedId!,
        status: 'ready',
        mimetype: 'application/pdf',
      });

      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
        files: [documentEn],
      });

      const { entityStatusManager } = createSut();

      await entityStatusManager.execute({
        before: {
          id: documentEn._id.toString(),
          type: documentEn.type!,
          entity: documentEn.entity!,
          language: 'pt',
          status: 'ready',
        },
        after: {
          id: documentEn._id.toString(),
          type: documentEn.type!,
          entity: documentEn.entity!,
          language: 'en',
          status: 'ready',
        },
      });

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([
        {
          _id: mongoEntityStatus._id,
          status: EntityStatus.Obsolete,
          extractorId: mongoEntityStatus.extractorId,
          entitySharedId: mongoEntityStatus.entitySharedId,
        },
      ]);
    });

    it('should change EntityStatus to processing_obsolete', async () => {
      const mongoEntityStatus: MongoPXEntityStatusDBO = {
        _id: factory.id('entity_status'),
        entitySharedId: entity.sharedId!,
        extractorId: extractor._id,
        status: EntityStatus.Processing,
      };

      const documentEn = factory.document('document_en', {
        _id: new ObjectId(),
        language: 'en',
        entity: entity.sharedId!,
        status: 'ready',
        mimetype: 'application/pdf',
      });

      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
        files: [documentEn],
      });

      const { entityStatusManager } = createSut();

      await entityStatusManager.execute({
        before: {
          id: documentEn._id.toString(),
          type: documentEn.type!,
          entity: documentEn.entity!,
          language: 'pt',
          status: 'ready',
        },
        after: {
          id: documentEn._id.toString(),
          type: documentEn.type!,
          entity: documentEn.entity!,
          language: 'en',
          status: 'ready',
        },
      });

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([
        {
          _id: mongoEntityStatus._id,
          status: EntityStatus.ProcessingObsolete,
          extractorId: mongoEntityStatus.extractorId,
          entitySharedId: mongoEntityStatus.entitySharedId,
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

      const { entityStatusManager } = createSut();

      await entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          language: 'pt',
          status: 'ready',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          language: 'en',
          status: 'ready',
        },
      });

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([
        {
          _id: expect.any(ObjectId),
          status: EntityStatus.New,
          extractorId: extractor._id,
          entitySharedId: entity.sharedId,
        },
      ]);
    });

    it('should do nothing if the updated Document was not used for paragraph Extraction', async () => {
      const mongoEntityStatus: MongoPXEntityStatusDBO = {
        _id: factory.id('entity_status'),
        entitySharedId: entity.sharedId!,
        extractorId: extractor._id,
        status: EntityStatus.Processed,
      };

      const documentEn = factory.document('document_en', {
        language: 'en',
        entity: entity.sharedId!,
        _id: new ObjectId(),
        mimetype: 'application/pdf',
      });

      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
        files: [documentEn],
      });

      const { entityStatusManager } = createSut();

      await entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'processing',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          language: 'en',
          status: 'ready',
        },
      });

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([mongoEntityStatus]);
    });

    it('should throw if the File is not a Document', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'custom',
          entity: entity.sharedId!,
          status: 'processing',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'custom',
          entity: entity.sharedId!,
          language: 'en',
          status: 'ready',
        },
      });

      await expect(promise).rejects.toThrow();
    });

    it('should throw if is not a processed Document', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'processing',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          language: 'en',
          status: 'failed',
        },
      });

      await expect(promise).rejects.toThrow();
    });

    it('should throw if there is no change on the Document language', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'ready',
          language: 'en',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'ready',
          language: 'en',
        },
      });

      await expect(promise).rejects.toThrow();
    });

    it('should throw if source Entity does not exist', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: 'any_source_entity',
          status: 'ready',
          language: 'en',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: 'any_source_entity',
          status: 'ready',
          language: 'pt',
        },
      });

      await expect(promise).rejects.toThrow();
    });

    it('should throw if Document language does not belongs to UI Languages', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'ready',
          language: 'en',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity.sharedId!,
          status: 'ready',
          language: 'pt',
        },
      });

      await expect(promise).rejects.toThrow();
    });

    it('should throw if source Entity does not match with the Extractor source Template', async () => {
      const { entityStatusManager } = createSut();

      const promise = entityStatusManager.execute({
        before: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity2.sharedId!,
          status: 'processing',
        },
        after: {
          id: new ObjectId().toString(),
          type: 'document',
          entity: entity2.sharedId!,
          status: 'ready',
          language: 'en',
        },
      });

      await expect(promise).rejects.toThrow();
    });
  });
});
