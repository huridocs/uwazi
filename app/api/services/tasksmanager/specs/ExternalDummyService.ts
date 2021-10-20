/* eslint-disable camelcase */
import express from 'express';
import RedisSMQ, { QueueMessage } from 'rsmq';
import Redis, { RedisClient } from 'redis';
import { Server } from 'http';
import bodyParser from 'body-parser';
import { uploadMiddleware } from 'api/files';
import { ResultsMessage } from '../TaskManager';

export class ExternalDummyService {
  private app: express.Application;

  private readonly port: number;

  private redisSMQ: RedisSMQ | undefined;

  private server: Server | undefined;

  currentTask: string | undefined;

  materials: string[] = [];

  files: Buffer[] = [];

  filesNames: String[] = [];

  results: object | undefined;

  redisClient: RedisClient | undefined;

  fileResults: string | undefined;

  private readonly serviceName: string;

  constructor(port = 1234, serviceName = 'dummy') {
    this.port = port;
    this.serviceName = serviceName;
    this.app = express();
    this.app.use(bodyParser.json());

    this.app.post('/data', (req, res) => {
      this.materials.push(req.body);
      res.send('ok');
    });

    this.app.post('/files', uploadMiddleware.multiple(), (req, res) => {
      if (req.files.length) {
        const files = req.files as { buffer: Buffer; originalname: string }[];
        this.files.push(files[0].buffer);
        this.filesNames.push(files[0].originalname);
      }
      res.send('received');
    });

    this.app.get('/results', (_req, res) => {
      res.json(JSON.stringify(this.results));
    });

    this.app.get('/file', (_req, res) => {
      if (!this.fileResults) {
        res.status(404).send('Not found');
        return;
      }

      res.sendFile(this.fileResults);
    });
  }

  setResults(results: object) {
    this.results = results;
  }

  setFileResults(file: string) {
    this.fileResults = file;
  }

  get rsmq() {
    if (!this.redisSMQ) {
      throw new Error('rsmq is not initialized');
    }
    return this.redisSMQ;
  }

  async deleteQueue(qname: string) {
    try {
      await this.rsmq.deleteQueueAsync({ qname });
    } catch (err) {
      if (err instanceof Error && err.name !== 'queueNotFound') {
        throw err;
      }
    }
  }

  async createQueue(qname: string) {
    try {
      await this.rsmq.createQueueAsync({ qname });
    } catch (err) {
      if (err instanceof Error && err.name !== 'queueExists') {
        throw err;
      }
    }
  }

  async resetQueue() {
    await this.deleteQueue(`${this.serviceName}_tasks`);
    await this.deleteQueue(`${this.serviceName}_results`);

    await this.createQueue(`${this.serviceName}_tasks`);
    await this.createQueue(`${this.serviceName}_results`);
  }

  async readFirstTaskMessage() {
    const message: RedisSMQ.QueueMessage | {} = await this.rsmq.receiveMessageAsync({
      qname: `${this.serviceName}_tasks`,
    });
    const queueMessage = message as QueueMessage;

    if (!queueMessage.id) {
      return undefined;
    }

    await this.rsmq.deleteMessageAsync({
      qname: `${this.serviceName}_tasks`,
      id: queueMessage.id,
    });

    return queueMessage?.message;
  }

  async readAllTaskMessages() {
    const messages: string[] = [];
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const message = await this.readFirstTaskMessage();
      if (!message) {
        break;
      }
      messages.push(message);
    }

    return messages;
  }

  async start(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = await Redis.createClient(redisUrl);

      this.redisSMQ = await new RedisSMQ({ client: this.redisClient });
      await this.resetQueue();
    }

    const start = new Promise<void>(resolve => {
      this.server = this.app.listen(this.port, () => {
        resolve();
      });
    });

    return start;
  }

  async stop() {
    await this.redisClient?.end(true);
    await this.server?.close();
  }

  async sendFinishedMessage(task: ResultsMessage) {
    try {
      await this.rsmq.sendMessageAsync({
        qname: `${this.serviceName}_results`,
        message: JSON.stringify(task),
      });
    } catch (err) {
      console.log(err);
    }
  }

  reset() {
    this.files = [];
    this.filesNames = [];
  }
}
