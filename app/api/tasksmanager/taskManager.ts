import RedisSMQ, { QueueMessage } from 'rsmq';
import Redis, { RedisClient } from 'redis';
import request from 'shared/JSONRequest';
import { Repeater } from 'api/utils/Repeater';

export interface TaskMessage {
  tenant: string;
  task: string;
}

export interface Service {
  serviceName: string;
  filesUrl: string;
  dataUrl: string;
  resultsUrl: string;
  redisUrl: string;
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
  }

  async createQueue(queueName: string) {
    try {
      if (this.redisSMQ) {
        await this.redisSMQ.createQueueAsync({ qname: queueName });
      }
    } catch (err) {
      if (err.name === 'queueExists') {
        console.log('queueExists');
      }
    }
  }

  async start() {
    this.redisClient = await Redis.createClient(this.service.redisUrl);

    this.redisClient.on('error', e => {
      throw e;
    });

    this.redisSMQ = new RedisSMQ({
      client: this.redisClient,
    });

    await this.createQueue(this.taskQueue);
    await this.createQueue(this.resultsQueue);

    this.repeater = new Repeater(this.receiveMessage.bind(this), 1000);
    this.repeater.start();
  }

  async receiveMessage() {
    if (this.redisSMQ) {
      const message = (await this.redisSMQ.receiveMessageAsync({
        qname: this.resultsQueue,
      })) as QueueMessage;

      if (message.id) {
        if (this.service.processResults) {
          const results = await request.get(this.service.resultsUrl, JSON.parse(message.message));
          this.service.processResults(results.json);
        }
      }
    }
  }

  async startTask(taskMessage: TaskMessage) {
    if (this.redisSMQ) {
      await this.redisSMQ.sendMessageAsync({
        qname: this.taskQueue,
        message: JSON.stringify(taskMessage),
      });
    }
  }

  async sendJSON(data: object) {
    await request.post(this.service.dataUrl, data);
  }

  async sendFile(file: Buffer) {
    await request.uploadFile(this.service.filesUrl, 'blank.pdf', file);
  }

  async stop() {
    if (this.repeater) {
      await this.repeater.stop();
    }
  }
}
