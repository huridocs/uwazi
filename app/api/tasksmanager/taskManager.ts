import RedisSMQ from 'rsmq';

class TaskManager {
  private rsmq: RedisSMQ;

  private queueName: string;

  constructor(rsmq: RedisSMQ, queueName: string) {
    this.rsmq = rsmq;
    this.queueName = queueName;

    rsmq.createQueue({ qname: queueName }, err => {
      if (err && err.name !== 'queueExists') {
        // if the error is `queueExists` we can keep going as it tells us that the queue is already there
        throw err;
      }
    });
  }

  addTask(message: string) {
    this.rsmq.sendMessage({ qname: this.queueName, message });
  }
}

export { TaskManager };
