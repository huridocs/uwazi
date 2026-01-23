import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { tenants } from '#api/tenants/index.js';

import { QueueAdapter } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';

import testingDB from '#api/utils/testing_db.js';

import { DefaultTestingQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';

import { NamespacedDispatcher } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { UpdateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob.js';
import { UpdateTemplateRelationshipPropertiesJob } from '#api/relationships.v2/services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const fixturesFactory = getFixturesFactory();

beforeEach(async () => {
  await testingEnvironment.setUp({
    entities: [
      fixturesFactory.entity('entity1', 'template1'),
      fixturesFactory.entity('entity2', 'template1'),
      fixturesFactory.entity('entity3', 'template2'),
      fixturesFactory.entity('entity4', 'template1'),
    ],
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when handled', () => {
  const expectedBatches = [['entity1', 'entity2'], ['entity4']];
  let adapter: QueueAdapter;
  let heartbeatCallback: jest.Mock;

  beforeEach(async () => {
    adapter = DefaultTestingQueueAdapter();

    const entitiesDataSource = DefaultEntitiesDataSource(TransactionManagerFactory.default());
    const dispatcher = new NamespacedDispatcher(tenants.current().name, 'test queue', adapter);

    const job = new UpdateTemplateRelationshipPropertiesJob(entitiesDataSource, dispatcher);

    UpdateTemplateRelationshipPropertiesJob.BATCH_SIZE = 2;

    heartbeatCallback = jest.fn().mockResolvedValue(undefined);

    await job.handleDispatch(heartbeatCallback, {
      templateId: fixturesFactory.id('template1').toHexString(),
    });
  });

  it('should schedule a job per entity batch in the template', async () => {
    const jobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();

    jobs!.forEach((job, index) => {
      expect(job.name).toBe(UpdateRelationshipPropertiesJob.name);
      expect(job.params.entityIds).toEqual(expectedBatches[index]);
    });
  });

  it('should call the heartbeatCallback once per batch', async () => {
    expect(heartbeatCallback).toHaveBeenCalledTimes(expectedBatches.length);
  });
});
