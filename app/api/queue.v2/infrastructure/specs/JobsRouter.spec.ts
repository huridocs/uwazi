/* eslint-disable max-statements */
import { config } from 'api/config';
import { Dispatchable } from 'api/queue.v2/application/contracts/Dispatchable';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTestingQueueAdapter } from 'api/queue.v2/configuration/factories';
import { Queue } from '../Queue';
import { JobsRouter } from '../JobsRouter';

class ExampleJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

beforeEach(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

it('should dispatch the job to the configured queue', async () => {
  const adapter = DefaultTestingQueueAdapter();

  const queues: Record<string, Queue> = {};

  const router = new JobsRouter(name => {
    const queue = new Queue(name, adapter);
    queues[name] = queue;
    return queue;
  });

  config.queueName = 'queue1';
  await router.dispatch(ExampleJob, undefined);

  config.queueName = 'queue2';
  await router.dispatch(ExampleJob, undefined);

  const result11 = await queues.queue1.peek();
  const result12 = await queues.queue1.peek();

  const result21 = await queues.queue2.peek();
  const result22 = await queues.queue2.peek();

  expect(result11).toMatchObject({
    name: ExampleJob.name,
  });
  expect(result12).toBe(null);
  expect(result21).toMatchObject({
    name: ExampleJob.name,
  });
  expect(result22).toBe(null);
});
