import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { EntityDeletedEvent } from '#api/entities/events/EntityDeletedEvent.js';
import { tenants } from '#api/tenants/index.js';
import { DB } from '#api/odm/index.js';
import { testingTenants } from '#api/utils/testingTenants.js';
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

/** Events are emitted inside a request or job context in production. */
const emitInContext = async (bus: EventsBus, event: Parameters<EventsBus['emit']>[0]) =>
  testingEnvironment.runWithContext(async () => bus.emit(event));

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

    await emitInContext(eventBus, new EntityDeletedEvent({ entity: entities }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toHaveLength(0);
  });

  it('should do nothing if the deleted Entity does not have an EntityStatus associated', async () => {
    const eventBus = new EventsBus();
    new PXEntityDeletedListener(eventBus).start();

    await emitInContext(
      eventBus,
      new EntityDeletedEvent({
        entity: factory.entityInMultipleLanguages(['en', 'pt'], 'entity_not_processed'),
      })
    );

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });

  it('should delete from the database of the tenant each event belongs to', async () => {
    const eventBus = new EventsBus();
    new PXEntityDeletedListener(eventBus).start();
    const firstTenant = testingTenants.current();
    const otherDbName = `${firstTenant.dbName.slice(0, 40)}_other_tenant`;
    const otherDb = DB.mongodb_Db(otherDbName);
    await otherDb.collection(mongoPXEntitiesStatusCollection).insertOne({ ...mongoEntityStatus });

    await emitInContext(
      eventBus,
      new EntityDeletedEvent({
        entity: factory.entityInMultipleLanguages(['en'], 'entity_not_processed'),
      })
    );

    testingTenants.changeCurrentTenant({
      name: 'other_tenant',
      dbName: otherDbName,
      featureFlags: { paragraphExtraction: true },
    });
    try {
      await emitInContext(eventBus, new EntityDeletedEvent({ entity: entities }));

      expect(await otherDb.collection(mongoPXEntitiesStatusCollection).find().toArray()).toEqual(
        []
      );
    } finally {
      testingTenants.mockCurrentTenant(firstTenant);
      await otherDb.dropDatabase();
    }
  });

  it('should do nothing if feature flag not enabled', async () => {
    const eventBus = new EventsBus();
    tenants.current().featureFlags!.paragraphExtraction = false;
    new PXEntityDeletedListener(eventBus).start();

    await emitInContext(eventBus, new EntityDeletedEvent({ entity: entities }));

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toEqual([mongoEntityStatus]);
  });
});
