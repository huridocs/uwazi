/* eslint-disable no-await-in-loop */
import RedisSMQ, { QueueMessage } from 'rsmq';
import Redis, { RedisClient } from 'redis';
import { Repeater } from 'api/utils/Repeater';
import { config } from 'api/config';
import { handleError } from 'api/utils';

type DefaultTaskType = string;

type DefaultMessageParameters = Record<string, any>;

export type TaskMessage = {
  tenant: string;
  task: DefaultTaskType;
  params?: DefaultMessageParameters;
};

/* eslint-disable camelcase */
export interface ResultsMessage {
  tenant: string;
  task: DefaultTaskType;
  params?: DefaultMessageParameters;
  data_url?: string;
  file_url?: string;
  success?: boolean;
  error_message?: string;
}
/* eslint-enable camelcase */

export interface Service<R = ResultsMessage> {
  serviceName: string;
  processResults?: (results: R) => Promise<void>;
  processResultsMessageHiddenTime?: number;
}

export class TaskManager<T = TaskMessage, R = ResultsMessage> {
  redisSMQ: RedisSMQ;

  readonly service: Service<R>;

  readonly taskQueue: string;

  readonly resultsQueue: string;

  private repeater: Repeater | undefined;

  redisClient: RedisClient;

  constructor(service: Service<R>) {
    this.service = service;
    this.taskQueue = `${config.ENVIRONMENT}_${service.serviceName}_tasks`;
    this.resultsQueue = `${config.ENVIRONMENT}_${service.serviceName}_results`;
    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    this.redisClient = Redis.createClient(redisUrl);
    this.redisSMQ = new RedisSMQ({ client: this.redisClient });

    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.redisClient.on('error', (error: any | undefined) => {
      if (error && error.code !== 'ECONNREFUSED') {
        throw error;
      }
    });

    this.redisClient.on('connect', () => {
      this.redisSMQ.createQueue({ qname: this.taskQueue }, (err: Error | undefined) => {
        if (err && err.name !== 'queueExists') {
          throw err;
        }
      });
      this.redisSMQ.createQueue({ qname: this.resultsQueue }, (err: Error | undefined) => {
        if (err && err.name !== 'queueExists') {
          throw err;
        }
      });
    });
  }

  async countPendingTasks(): Promise<number> {
    const queueAttributes = await this.redisSMQ!.getQueueAttributesAsync({
      qname: this.taskQueue,
    });
    return queueAttributes.msgs;
  }

  subscribeToResults(interval = 500): void {
    this.repeater = new Repeater(this.checkForResults.bind(this), interval);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.repeater.start();
  }

  private async checkForResults() {
    if (!this.redisClient?.connected) {
      return;
    }

    try {
      const message = (await this.redisSMQ.receiveMessageAsync({
        qname: this.resultsQueue,
        vt: this.service.processResultsMessageHiddenTime,
      })) as QueueMessage;

      if (message.id && this.service.processResults) {
        await this.redisSMQ.deleteMessageAsync({
          qname: this.resultsQueue,
          id: message.id,
        });

        const processedMessage = JSON.parse(message.message);

        await this.service.processResults(processedMessage);
      }
    } catch (e) {
      handleError(e, { useContext: false });
    }
  }

  async startTask(taskMessage: T) {
    if (!this.redisClient.connected) {
      throw new Error('Redis is not connected');
    }

    return this.redisSMQ.sendMessageAsync({
      qname: this.taskQueue,
      message: JSON.stringify(taskMessage),
    });
  }

  async stop() {
    if (this.repeater) {
      await this.repeater.stop();
    }
    await this.redisClient.end(true);
  }
}
