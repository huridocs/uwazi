import RedisSMQ, { QueueMessage } from 'rsmq';
import Redis, { RedisClient } from 'redis';
import request from 'shared/JSONRequest';
import { Repeater } from 'api/utils/Repeater';
import { config } from 'api/config';

export interface TaskMessage {
  tenant: string;
  task: string;
}

export interface Service {
  serviceName: string;
  processResults?: (results: object) => void;
}

export class TaskManager {
  private redisSMQ: RedisSMQ | undefined;

  private readonly service: Service;

  private readonly taskQueue: string;

  private readonly resultsQueue: string;

  private repeater: Repeater | undefined;

  private redisClient: RedisClient | undefined;

  constructor(service: Service) {
    this.service = service;
    this.taskQueue = `${service.serviceName}_tasks`;
    this.resultsQueue = `${service.serviceName}_results`;
    this.start();
  }

  start() {
    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    this.redisClient = Redis.createClient(redisUrl);

    this.redisClient.on('error', error => {
      if (error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    this.redisSMQ = new RedisSMQ({
      client: this.redisClient,
    });

    this.redisClient.on('connect', () => {
      this.redisSMQ?.createQueue({ qname: this.taskQueue }, err => {
        if (err && err.name !== 'queueExists') {
          throw err;
        }
      });
      this.redisSMQ?.createQueue({ qname: this.resultsQueue }, err => {
        if (err && err.name !== 'queueExists') {
          throw err;
        }
      });
    });
  }

  countPendingTasks: () => Promise<number> = async () => {
    const queueAttributes = await this.redisSMQ!.getQueueAttributesAsync({ qname: this.taskQueue });
    return queueAttributes.msgs;
  };

  subscribeToResults() {
    this.repeater = new Repeater(this.receiveMessage.bind(this), 1000);
    this.repeater.start();
  }

  async receiveMessage() {
    if (this.redisClient?.connected) {
      const message = (await this.redisSMQ?.receiveMessageAsync({
        qname: this.resultsQueue,
      })) as QueueMessage;

      if (message.id) {
        if (this.service.processResults) {
          const processedMessage = JSON.parse(message.message);
          const results = await request.get(processedMessage.resultsUrl, processedMessage);
          this.service.processResults(results.json);
        }
      }
    }
  }

  async startTask(taskMessage: TaskMessage) {
    if (!this.redisClient?.connected) {
      throw new Error('Redis is not connected');
    }

    return this.redisSMQ?.sendMessageAsync({
      qname: this.taskQueue,
      message: JSON.stringify(taskMessage),
    });
  }

  async sendJSON(data: object) {
    await request.post(this.service.dataUrl, data);
  }

  async sendFile(file: Buffer, fileName: string) {
    await request.uploadFile(this.service.filesUrl, fileName, file);
  }

  async stop() {
    await this.repeater?.stop();
    await this.redisClient?.end(true);
  }
}
