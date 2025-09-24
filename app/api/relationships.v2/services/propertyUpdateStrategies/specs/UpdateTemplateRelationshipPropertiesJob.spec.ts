// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/data_s... Remove this comment to see the full error message
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';

import { getFixturesFactory } from 'api/utils/fixturesFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/Que... Remove this comment to see the full error message
import { QueueAdapter } from '../queue.v2/infrastructure/QueueAdapter.js';

import testingDB from 'api/utils/testing_db.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/configuration/fact... Remove this comment to see the full error message
import { DefaultTestingQueueAdapter } from '../queue.v2/configuration/factories.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/Nam... Remove this comment to see the full error message
import { NamespacedDispatcher } from '../queue.v2/infrastructure/NamespacedDispatcher.js';
import { UpdateRelationshipPropertiesJob } from '../UpdateRelationshipPropertiesJob';
import { UpdateTemplateRelationshipPropertiesJob } from '../UpdateTemplateRelationshipPropertiesJob';

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

    const entitiesDataSource = DefaultEntitiesDataSource(DefaultTransactionManager());
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

    // @ts-expect-error TS(7006): Parameter 'job' implicitly has an 'any' type.
    jobs!.forEach((job, index) => {
      expect(job.name).toBe(UpdateRelationshipPropertiesJob.name);
      expect(job.params.entityIds).toEqual(expectedBatches[index]);
    });
  });

  it('should call the heartbeatCallback once per batch', async () => {
    expect(heartbeatCallback).toHaveBeenCalledTimes(expectedBatches.length);
  });
});
