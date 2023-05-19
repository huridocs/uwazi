/* eslint-disable max-classes-per-file */
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { Job } from 'api/queue/contracts/Job';
import { Queue } from '../Queue';
import { QueueWorker } from '../QueueWorker';
import { QueueAdapter } from '../QueueAdapter';

it('should work', done => {
  let _id = 0;
  let buffer: { id: string; message: string }[] = [];
  const queue = new Queue(
    'asdf',
    partialImplementation<QueueAdapter>({
      async sendMessageAsync({ message }) {
        // eslint-disable-next-line no-plusplus
        buffer.push({ id: `${_id++}`, message });
        return `${_id}`;
      },
      async receiveMessageAsync() {
        return buffer[0] ?? {};
      },
      async deleteMessageAsync({ id }) {
        buffer = buffer.filter(item => item.id !== id);
      },
    })
  );
  const worker = new QueueWorker(queue);

  worker
    .start()
    .then(() => {
      console.log('Done');
      done();
    })
    .catch(done.fail);

  class A {
    do() {
      console.log('did');
    }
  }

  class SampleJob implements Job {
    a?: A;

    private data: { piece: string[] };

    private aNumber: number;

    constructor(data: { piece: string[] }, aNumber: number) {
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

  queue.register(SampleJob, () => ({ a: new A() }));

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  Promise.all(
    [1, 2, 3, 4, 5, 6].map(async n =>
      queue.dispatch(new SampleJob({ piece: '.'.repeat(n).split('') }, n))
    )
  ).then(async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    await worker.stop();
  });
}, 10000);
