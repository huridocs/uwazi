import express from 'express';
import RedisSMQ from 'rsmq';
import Redis from 'redis';
import { Server } from 'http';

export class DummyService {
  private app: express.Application;

  port: number;

  private rsmqClient: RedisSMQ | undefined;

  queueName = 'KonzNGaboHellKitchen';

  private server: Server | undefined;

  currentTask: string | undefined;

  materials: string[] = [];

  constructor(port: number) {
    this.port = port;
    this.app = express();

    this.app.post('/materials', (_req, res) => {
      this.materials.push(_req.body.material);
      res.send('ok');
    });
  }

  get rsmq() {
    if (!this.rsmqClient) {
      throw new Error('rsmq is not initialized');
    }
    return this.rsmqClient;
  }

  async initQueue() {
    try {
      await this.rsmq.deleteQueueAsync({ qname: this.queueName });
    } catch (err) {
      console.log(err);
      if (err.name !== 'queueNotFound') {
        throw err;
      }
    }

    try {
      await this.rsmq.createQueueAsync({ qname: this.queueName });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }
  }

  async read() {
    try {
      const { qname, message } = await this.rsmq.receiveMessageAsync({
        qname: this.queueName,
      });
      this.currentTask = message;
      return message;
    } catch (e) {
      console.log(e);
    }
  }

  async start(client: Redis.RedisClient) {
    this.rsmqClient = await new RedisSMQ({ client });
    await this.initQueue();

    const start = new Promise<void>(resolve => {
      this.server = this.app.listen(this.port, () => {
        resolve();
      });
    });

    return start;
  }

  async stop() {
    await this.server?.close();
  }
}
