import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { tenants } from 'api/tenants';
import { RedisQueue } from 'api/queue.v2/infrastructure/RedisQueue';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getConnection, getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoQueueAdapter } from 'api/queue.v2/infrastructure/MongoQueueAdapter';
import { QueueAdapter } from 'api/queue.v2/infrastructure/QueueAdapter';
import { UpdateRelationshipPropertiesJob } from '../UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob } from '../UpdateTemplateRelationshipPropertiesJob';
import testingDB from 'api/utils/testing_db';

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
  let memoryAdapter: QueueAdapter;
  let heartbeatCallback: jest.Mock;

  beforeEach(async () => {
    memoryAdapter = new MongoQueueAdapter(
      getConnection(),
      new MongoTransactionManager(getClient())
    );

    const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());
    const dispatcher = new RedisQueue('test queue', memoryAdapter, {
      namespace: tenants.current().name,
    });

    const job = new UpdateTemplateRelationshipPropertiesJob(entitiesDataSource, dispatcher);

    UpdateTemplateRelationshipPropertiesJob.BATCH_SIZE = 2;

    heartbeatCallback = jest.fn().mockResolvedValue(undefined);

    await job.handleDispatch(heartbeatCallback, {
      templateId: fixturesFactory.id('template1').toHexString(),
    });
  });

  it('should schedule a job per entity batch in the template', async () => {
    const jobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();

    jobs!.forEach((data, index) => {
      const parsedData = JSON.parse(data.message);
      expect(parsedData.name).toBe(UpdateRelationshipPropertiesJob.name);
      expect(parsedData.params.entityIds).toEqual(expectedBatches[index]);
    });
  });

  it('should call the heartbeatCallback once per batch', async () => {
    expect(heartbeatCallback).toHaveBeenCalledTimes(expectedBatches.length);
  });
});
