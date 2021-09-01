import RedisSMQ from 'rsmq';

class TaskManager {
  private queue;
  constructor(queue) {
    this.redisClient = redisClient;
  }

  addTask(task: string) {
    this.queue.sendMessage({ qname: this.queueName, message: task }, () => {});
  }
}

export { TaskManager };
