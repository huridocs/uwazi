import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { DBFixture } from 'api/utils/testing_db';
import { EventsBus } from 'api/eventsbus';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';

import { MongoExtractorBuilder } from './MongoPXExtractorBuilder';
import { mongoPXExtractorsCollection } from '../MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatus } from '../MongoPXEntityStatus';
import { PXEntityDeletedListener } from '../PXEntityDeletedListener';

const { extractor, sourceTemplate, targetTemplate, targetRelationship, sourceRelationship } =
  MongoExtractorBuilder.create().build();

const { factory } = MongoExtractorBuilder;

const entities = factory.entityInMultipleLanguages(
  ['en', 'pt'],
  'entity_to_be_deleted',
  sourceTemplate.name
);

const mongoEntityStatus: MongoPXEntityStatus = {
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
  });

  afterAll(async () => {
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
});
