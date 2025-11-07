import { EventsBus } from 'api/core/libs/eventsbus';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { ObjectId } from 'mongodb';
import { tenants } from 'api/tenants';
import { PXEntityUpdatedListener } from '../PXEntityUpdatedListener';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO';
import { MongoExtractorBuilder } from './MongoPXExtractorBuilder';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';

const languages = ['en', 'es'];

const { extractor, sourceRelationship, sourceTemplate, targetRelationship, targetTemplate } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const sourceTemplate2 = factory.template('source_template_2');

const { extractor: extractor2 } = MongoExtractorBuilder.create()
  .withSourceTemplate(sourceTemplate2)
  .withTargetTemplate(targetTemplate)
  .withSourceRelationship(sourceRelationship)
  .withTargetRelationship(targetRelationship)
  .build();

const template = factory.template('template');

const entity1 = factory.entityInMultipleLanguages(languages, 'entity1', sourceTemplate.name);

const entity2 = factory.entityInMultipleLanguages(languages, 'entity2', sourceTemplate.name);

const entity3 = factory.entityInMultipleLanguages(languages, 'entity3', sourceTemplate2.name);

const entityStatus1: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_1'),
  status: EntityStatus.Processed,
  entitySharedId: entity1[0].sharedId!,
  extractorId: extractor._id,
};

const entityStatus2: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_2'),
  status: EntityStatus.Processed,
  entitySharedId: entity2[0].sharedId!,
  extractorId: extractor._id,
};

const entityStatus3: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status_3'),
  status: EntityStatus.Processed,
  entitySharedId: entity3[0].sharedId!,
  extractorId: extractor2._id,
};

const document1En = factory.processedDocument('document_1_En', {
  entity: entity1[0].sharedId,
  language: 'en',
});

const createFixtures = (): DBFixture => ({
  templates: [sourceTemplate, sourceTemplate2, targetTemplate],
  [mongoPXExtractorsCollection]: [extractor, extractor2],
  relationtypes: [sourceRelationship, targetRelationship],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
});

const createSut = () => {
  const eventsBus = new EventsBus();

  new PXEntityUpdatedListener(eventsBus).start();

  return {
    eventsBus,
  };
};

describe('PXEntityUpdatedListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
    tenants.current().featureFlags!.paragraphExtraction = true;
  });

  afterAll(async () => {
    tenants.current().featureFlags!.paragraphExtraction = false;
    await testingEnvironment.tearDown();
  });

  describe('given templated was updated', () => {
    it('should do nothing if feature flag not enabled', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [document1En],
      });

      tenants.current().featureFlags!.paragraphExtraction = false;

      const { eventsBus } = createSut();

      await eventsBus.emit(
        new EntityUpdatedEvent({
          before: entity1.map(e => ({ ...e, template: template._id })),
          after: entity1,
          targetLanguageKey: 'en',
        })
      );

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([]);
    });

    it('should create EntityStatus as new if source Entity can be used for extraction', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        files: [document1En],
      });

      const { eventsBus } = createSut();

      await eventsBus.emit(
        new EntityUpdatedEvent({
          before: entity1.map(e => ({ ...e, template: template._id })),
          after: entity1,
          targetLanguageKey: 'en',
        })
      );

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([
        {
          _id: expect.any(ObjectId),
          status: EntityStatus.New,
          entitySharedId: entity1[0].sharedId,
          extractorId: extractor._id,
        },
      ]);
    });

    it('should delete EntityStatus if source Entity can not be used for extraction', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [entityStatus1, entityStatus2],
      });

      const { eventsBus } = createSut();

      await eventsBus.emit(
        new EntityUpdatedEvent({
          before: entity1,
          after: entity1.map(e => ({ ...e, template: template._id })),
          targetLanguageKey: 'en',
        })
      );

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toHaveLength(1);
      expect(entitiesStatus).not.toMatchObject([entityStatus1]);
    });

    it('should delete old EntityStatus and create new if Entity can be use for extraction', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [entityStatus1, entityStatus2, entityStatus3],
        files: [document1En],
      });

      const { eventsBus } = createSut();

      await eventsBus.emit(
        new EntityUpdatedEvent({
          before: entity1,
          after: entity1.map(e => ({ ...e, template: sourceTemplate2._id })),
          targetLanguageKey: 'en',
        })
      );

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toMatchObject([
        entityStatus2,
        entityStatus3,
        {
          _id: expect.any(ObjectId),
          status: EntityStatus.New,
          entitySharedId: entity1[0].sharedId,
          extractorId: extractor2._id,
        },
      ]);
    });
  });

  describe('given template was not updated', () => {
    it('should no nothing', async () => {
      await testingEnvironment.setFixtures({
        ...createFixtures(),
        [mongoPXEntitiesStatusCollection]: [entityStatus1],
      });

      const { eventsBus } = createSut();

      await eventsBus.emit(
        new EntityUpdatedEvent({
          after: entity1,
          before: entity1.map(e => ({ ...e, template: new ObjectId(e.template?.toString()) })),
          targetLanguageKey: 'en',
        })
      );

      const entitiesStatus = await testingEnvironment.db.getAllFrom(
        mongoPXEntitiesStatusCollection
      );

      expect(entitiesStatus).toEqual([entityStatus1]);
    });
  });
});
