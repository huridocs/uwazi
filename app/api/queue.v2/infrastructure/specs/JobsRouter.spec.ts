/* eslint-disable max-statements */
import { config } from 'api/config';
import { Queue } from 'api/queue.v2/application/Queue';
import { Job } from 'api/queue.v2/contracts/Job';
import { MemoryQueueAdapter } from '../MemoryQueueAdapter';
import { StringJobSerializer } from '../StringJobSerializer';
import { JobsRouter } from '../JobsRouter';

class ExampleJob extends Job {
  // eslint-disable-next-line class-methods-use-this
  async handle(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

it('should dispatch the job to the configured queue', async () => {
  const adapter = new MemoryQueueAdapter();

  const queues: Record<string, Queue> = {};

  const router = new JobsRouter(name => {
    const queue = new Queue(name, adapter, StringJobSerializer);
    queue.register(ExampleJob, async () => ({}));
    queues[name] = queue;
    return queue;
  });

  config.queueName = 'queue1';
  await router.dispatch(new ExampleJob());

  config.queueName = 'queue2';
  await router.dispatch(new ExampleJob());

  const result11 = await queues.queue1.peek();
  const result12 = await queues.queue1.peek();

  const result21 = await queues.queue2.peek();
  const result22 = await queues.queue2.peek();

  expect(result11).toBeInstanceOf(ExampleJob);
  expect(result12).toBe(null);
  expect(result21).toBeInstanceOf(ExampleJob);
  expect(result22).toBe(null);
});
