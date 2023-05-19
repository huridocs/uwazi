/* eslint-disable no-void */
/* eslint-disable max-classes-per-file */
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { Job } from 'api/queue/contracts/Job';
import { QueueAdapter } from 'api/queue/contracts/QueueAdapter';
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

function createQueueAdapter() {
  let _id = 0;
  let queue: { id: string; message: string }[] = [];
  return partialImplementation<QueueAdapter>({
    async sendMessageAsync({ message }) {
      _id += 1;
      queue.push({ id: `${_id}`, message });
      return `${_id}`;
    },
    async receiveMessageAsync() {
      return queue[0] ?? {};
    },
    async deleteMessageAsync({ id }) {
      queue = queue.filter(item => item.id !== id);
    },
  });
}

it('should work', done => {
  const adapter = createQueueAdapter();
  const consumerQueue = new Queue('asdf', adapter);
  const worker = new QueueWorker(consumerQueue);

  worker
    .start()
    .then(() => {
      console.log('Done');
      done();
    })
    .catch(done.fail);

  consumerQueue.register(SampleJob, async namespace => ({ a: new A(namespace) }));

  const producerQueue = new Queue('asdf', adapter, { namespaceFactory: async () => 'tenant1' });

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
