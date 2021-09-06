import RedisSMQ from 'rsmq';
import Redis from 'redis';

export interface Task {
  tenant: string;
  task: string;
}

export interface Materials {
  data: string;
}

export class TaskManager {
  private rsmq: RedisSMQ;

  private queueName: string;

  private serviceUrl: string;

  constructor(rsmq: RedisSMQ, queueName: string, serviceUrl: string) {
    this.rsmq = rsmq;
    this.queueName = queueName;
    this.serviceUrl = serviceUrl;
  }

  async initQueue() {
    try {
      await this.rsmq.createQueueAsync({ qname: this.queueName });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }
  }

  async startTask(message: Task, materials?: Materials) {
    await this.rsmq.sendMessageAsync({
      qname: this.queueName,
      message: JSON.stringify(message),
    });
  }
}

export const TaskManagerFactory = {
  create: async (redis: Redis.RedisClient, queueName: string) => {
    const rsmq = await new RedisSMQ({ client: redis });
    const manager = await new TaskManager(rsmq, queueName);
    await manager.initQueue();
    return manager;
  },
};
