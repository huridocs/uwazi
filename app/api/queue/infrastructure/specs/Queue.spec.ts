import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import RedisSMQ from 'rsmq';
import { Job } from 'api/queue/contracts/Job';
import { Queue } from '../Queue';

it('should correctly serialize and deserialize a job', async () => {
  const buffer: any[] = [];
  const queue = new Queue(
    'asdf',
    partialImplementation<RedisSMQ>({
      async sendMessageAsync({ message }) {
        buffer.push({ id: buffer.length, message });
        return `${buffer.length - 1}`;
      },
      async receiveMessageAsync() {
        return buffer.shift();
      },
    })
  );

  class SampleJob implements Job {
    private data: { piece: string[] };

    private aNumber: number;

    constructor(data: { piece: string[] }, aNumber: number) {
      this.data = data;
      this.aNumber = aNumber;
    }

    private somePrivateMethod() {
      console.log(this.aNumber, this.data.piece.join('|'));
    }

    async handle(): Promise<void> {
      this.somePrivateMethod();
    }
  }

  queue.register(SampleJob);

  await queue.push(new SampleJob({ piece: ['a', 'b', 'c'] }, 2));

  const job = await queue.pop();
  console.log(job);
  await job?.handle();
});
