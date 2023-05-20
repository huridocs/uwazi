/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { Job } from 'api/queue/contracts/Job';
import { MemoryQueueAdapter } from 'api/queue/infrastructure/MemoryQueueAdapter';
import { StringJobSerializer } from 'api/queue/infrastructure/StringJobSerializer';
import { Queue } from '../Queue';
import { QueueWorker } from '../QueueWorker';

class A {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  do() {
    console.log(`did for ${JSON.stringify(this.namespace)}`);
  }
}

class SampleJob extends Job {
  a?: A;

  private data: { piece: string[] };

  private aNumber: number;

  constructor(data: { piece: string[] }, aNumber: number) {
    super();
    this.data = data;
    this.aNumber = aNumber;
  }

  private somePrivateMethod() {
    console.log(this.aNumber, this.data.piece.join('|'));
    this.a?.do();
  }

  async handle(): Promise<void> {
    this.somePrivateMethod();
  }
}

it('should work', done => {
  const adapter = new MemoryQueueAdapter();
  const consumerQueue = new Queue('asdf', adapter, StringJobSerializer);
  const worker = new QueueWorker(consumerQueue);

  worker
    .start()
    .then(() => {
      console.log('Done');
      done();
    })
    .catch(done.fail);

  consumerQueue.register(SampleJob, async namespace => ({ a: new A(namespace) }));

  const producerQueue = new Queue('asdf', adapter, StringJobSerializer, {
    namespaceFactory: async () => 'tenant1',
  });

  void Promise.all(
    [1, 2, 3, 4, 5, 6].map(async n =>
      producerQueue.dispatch(new SampleJob({ piece: '.'.repeat(n).split('') }, n))
    )
  ).then(async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    await worker.stop();
  });
}, 10000);
