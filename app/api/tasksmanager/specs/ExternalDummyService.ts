import express from 'express';
import RedisSMQ from 'rsmq';
import Redis from 'redis';
import { Server } from 'http';
import bodyParser from 'body-parser';
import { uploadMiddleware } from 'api/files';

export class ExternalDummyService {
  private app: express.Application;

  private readonly port: number;

  private redisSMQ: RedisSMQ | undefined;

  serviceName = 'KonzNGaboHellKitchen';

  private server: Server | undefined;

  currentTask: string | undefined;

  materials: string[] = [];

  files: Buffer[] = [];

  results: object | undefined;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.app.use(bodyParser.json());

    this.app.post('/data', (req, res) => {
      this.materials.push(req.body);
      res.send('ok');
    });

    this.app.post('/files', uploadMiddleware.multiple(), (req, res) => {
      if (req.files.length) {
        const files = req.files as { buffer: Buffer }[];
        this.files.push(files[0].buffer);
      }
      res.send('received');
    });

    this.app.get('/results', (_req, res) => {
      res.send(this.results);
    });
  }

  setResults(results: object) {
    this.results = results;
  }

  get rsmq() {
    if (!this.redisSMQ) {
      throw new Error('rsmq is not initialized');
    }
    return this.redisSMQ;
  }

  async initQueue() {
    try {
      await this.rsmq.deleteQueueAsync({ qname: `${this.serviceName}_tasks` });
    } catch (err) {
      console.log(err);
      if (err.name !== 'queueNotFound') {
        throw err;
      }
    }
    try {
      await this.rsmq.deleteQueueAsync({ qname: `${this.serviceName}_results` });
    } catch (err) {
      console.log(err);
      if (err.name !== 'queueNotFound') {
        throw err;
      }
    }

    try {
      await this.rsmq.createQueueAsync({ qname: `${this.serviceName}_tasks` });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }

    try {
      await this.rsmq.createQueueAsync({ qname: `${this.serviceName}_results` });
    } catch (err) {
      if (err.name !== 'queueExists') {
        throw err;
      }
    }
  }

  async read() {
    const { qname, message } = await this.rsmq.receiveMessageAsync({
      qname: this.serviceName + '_tasks',
    });
    this.currentTask = message;
    return message;
  }

  async start(client: Redis.RedisClient) {
    this.redisSMQ = await new RedisSMQ({ client });
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

  async sendFinishedMessage(task: { task: string; tenant: string }) {
    await this.rsmq.sendMessageAsync({
      qname: `${this.serviceName}_results`,
      message: JSON.stringify(task),
    });
  }
}
