import { Worker, WorkerOptions, RedisConnection } from 'bullmq';

type BullMQWorkerProps = {
  name: string;
  process: (task: any) => Promise<void>;
  options?: WorkerOptions;
  connection?: typeof RedisConnection;
};

class BullMQWorker {
  private _worker: Worker | null = null;

  constructor(private props: BullMQWorkerProps) {}

  start() {
    this._worker = new Worker(
      this.props.name,
      async task => this.props.process(JSON.parse(task.data)),
      this.props.options,
      this.props.connection
    );
  }

  get worker() {
    if (!this._worker) {
      throw new Error('There  is not worker instance to be closed.');
    }

    return this._worker;
  }
}

export { BullMQWorker };
