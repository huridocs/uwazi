import RedisSMQ from 'rsmq';

class TaskManager {
  private rsmq: RedisSMQ;

  private queueName: string;

  constructor(rsmq: RedisSMQ, queueName: string) {
    console.log(rsmq);
    this.rsmq = rsmq;
    this.queueName = queueName;
  }

  addTask(message: string) {
    this.rsmq.createQueue({ qname: this.queueName }, err => {
      if (err && err.name !== 'queueExists') {
        // if the error is `queueExists` we can keep going as it tells us that the queue is already there
        throw err;
      }
      this.rsmq.sendMessage({ qname: this.queueName, message }, () => {});
    });
  }
}

export { TaskManager };
