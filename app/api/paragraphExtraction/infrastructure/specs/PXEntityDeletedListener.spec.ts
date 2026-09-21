import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { EntityDeletedEvent } from '#api/entities/events/EntityDeletedEvent.js';
import { tenants } from '#api/tenants/index.js';
import { MongoExtractorBuilder } from './MongoPXExtractorBuilder.js';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource.js';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource.js';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO.js';
import { PXEntityDeletedListener } from '../PXEntityDeletedListener.js';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const entities = factory.entityInMultipleLanguages(
  ['en', 'pt'],
  'entity_to_be_deleted',
  sourceTemplate.name
);

const mongoEntityStatus: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status'),
  entitySharedId: entities[0].sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.Processed,
};

const createFixtures = (): DBFixture => ({
  templates: [targetTemplate, sourceTemplate],
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
  relationtypes: [sourceRelationship, targetRelationship],
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],
});

describe('PXEntityDeletedListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
    tenants.current().featureFlags!.paragraphExtraction = true;
  });

  afterAll(async () => {
    tenants.current().featureFlags!.paragraphExtraction = false;
    await testingEnvironment.tearDown();
  });

  it('should delete EntityStatus', async () => {
    const eventBus = new EventsBus();
    new PXEntityDeletedListener(eventBus).start();

    await eventBus.emit(new EntityDeletedEvent({ entity: entities }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toHaveLength(0);
  });

  it('should do nothing if the deleted Entity does not have an EntityStatus associated', async () => {
    const eventBus = new EventsBus();
    new PXEntityDeletedListener(eventBus).start();

    await eventBus.emit(
      new EntityDeletedEvent({
        entity: factory.entityInMultipleLanguages(['en', 'pt'], 'entity_not_processed'),
      })
    );

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });

  it('should do nothing if feature flag not enabled', async () => {
    const eventBus = new EventsBus();
    tenants.current().featureFlags!.paragraphExtraction = false;
    new PXEntityDeletedListener(eventBus).start();

    await eventBus.emit(new EntityDeletedEvent({ entity: entities }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });
});
