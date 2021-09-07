import RedisSMQ, { QueueMessage } from 'rsmq';
import Redis from 'redis';
import request from 'shared/JSONRequest';

export interface TaskMessage {
  tenant: string;
  task: string;
}

export interface Service {
  serviceName: string;
  filesUrl: string;
  dataUrl: string;
  resultsUrl: string;
}

export class TaskManager {
  private redisSMQ: RedisSMQ;

  private readonly service: Service;

  private readonly taskQueue: string;

  private readonly resultsQueue: string;

  private readonly processResults?: (results: object) => void;

  private listeningToQueue: NodeJS.Timeout | undefined;

  constructor(redisSMQ: RedisSMQ, service: Service, processResults?: (results: object) => void) {
    this.redisSMQ = redisSMQ;
    this.service = service;
    this.processResults = processResults;
    this.taskQueue = `${service.serviceName}_tasks`;
    this.resultsQueue = `${service.serviceName}_results`;
  }

  async initQueue() {
    try {
      await this.redisSMQ.createQueueAsync({ qname: this.taskQueue });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }
    try {
      await this.redisSMQ.createQueueAsync({ qname: this.resultsQueue });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }

    this.listeningToQueue = setInterval(() => {
      this.redisSMQ.receiveMessage({ qname: this.resultsQueue }, async (err, resp) => {
        if (err) {
          return;
        }

        const message = resp as QueueMessage;

        if (message.id) {
          if (this.processResults) {
            const results = await request.get(this.service.resultsUrl, JSON.parse(message.message));
            this.processResults(results.json);
          }
        }
      });
    }, 1000);
  }

  async startTask(taskMessage: TaskMessage) {
    await this.redisSMQ.sendMessageAsync({
      qname: this.taskQueue,
      message: JSON.stringify(taskMessage),
    });
  }

  async sendJSON(data: object) {
    await request.post(this.service.dataUrl, data);
  }

  async sendFile(file: Buffer) {
    await request.uploadFile(this.service.filesUrl, 'blank.pdf', file);
  }

  end() {
    if (this.listeningToQueue) {
      clearInterval(this.listeningToQueue);
    }
  }
}

export const TaskManagerFactory = {
  create: async (
    redis: Redis.RedisClient,
    service: Service,
    processResults?: (results: object) => void
  ) => {
    const redisSMQ = await new RedisSMQ({ client: redis });
    const manager = await new TaskManager(redisSMQ, service, processResults);
    await manager.initQueue();
    return manager;
  },
};
