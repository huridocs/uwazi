/* eslint-disable camelcase */
import bodyParser from 'body-parser';
import express, { RequestHandler } from 'express';
import { Server } from 'http';
import multer from 'multer';
import Redis, { RedisClient } from 'redis';
import RedisSMQ, { QueueMessage } from 'rsmq';
import { ResultsMessage } from '../TaskManager';

export class ExternalDummyService {
  private app: express.Application;

  private readonly port: number;

  private redisSMQ: RedisSMQ | undefined;

  private server: Server | undefined;

  currentTask: string | undefined;

  materials: any[] = [];

  files: Buffer[] = [];

  filesNames: String[] = [];

  results: any | undefined;

  redisClient: RedisClient | undefined;

  fileResults: string | undefined;

  private readonly serviceName: string;

  materialsDataParams: any;

  materialsFileParams: any;

  resultsDataParams: any;

  resultsFileParams: any;

  private errorSimulation: { type?: string; status?: number; code?: string } = {};

  public actualPort: number | undefined;

  constructor(port = 1234, serviceName = 'dummy', urlOptions = {}) {
    this.port = port;
    this.serviceName = serviceName;
    this.app = express();
    this.app.use(bodyParser.json() as RequestHandler);

    const urls = {
      materialsData: '/data',
      materialsFiles: '/files/*',
      resultsData: '/results',
      resultsFile: '/file',
      ...urlOptions,
    };

    this.app.post(urls.materialsData, multer().any(), async (req, res) => {
      try {
        if (this.errorSimulation.type) {
          const error = new Error(`Simulated ${this.errorSimulation.type} error`);
          (error as any).code = this.errorSimulation.type;
          throw error;
        }

        if (this.errorSimulation.status) {
          res.status(this.errorSimulation.status).json({
            error: `Simulated ${this.errorSimulation.status} error`,
          });
          return;
        }

        this.materials.push(req.body);
        this.materialsDataParams = req.params;
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.post(urls.materialsFiles, multer().any(), async (req, res) => {
      try {
        if (this.errorSimulation.type) {
          const error = new Error(`Simulated ${this.errorSimulation.type} error`);
          (error as any).code = this.errorSimulation.type;
          throw error;
        }

        if (this.errorSimulation.status) {
          res.status(this.errorSimulation.status).json({
            error: `Simulated ${this.errorSimulation.status} error`,
          });
          return;
        }

        if (req.files?.length) {
          const files = req.files as { buffer: Buffer; originalname: string }[];
          this.files.push(...files.map(f => f.buffer));
          this.filesNames.push(...files.map(f => f.originalname));
        }
        this.materialsFileParams = req.params;
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get(urls.resultsData, async (req, res) => {
      try {
        if (this.errorSimulation.type) {
          const error = new Error(`Simulated ${this.errorSimulation.type} error`);
          (error as any).code = this.errorSimulation.type;
          throw error;
        }

        if (this.errorSimulation.status) {
          res.status(this.errorSimulation.status).json({
            error: `Simulated ${this.errorSimulation.status} error`,
          });
          return;
        }

        this.resultsDataParams = req.params;
        res.json(JSON.stringify(this.results));
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get(urls.resultsFile, (req, res) => {
      this.resultsFileParams = req.params;
      if (!this.fileResults) {
        res.status(404).send('Not found');
        return;
      }

      res.sendFile(this.fileResults);
    });
  }

  setResults(results: any) {
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
    await this.deleteQueue(`development_${this.serviceName}_tasks`);
    await this.deleteQueue(`development_${this.serviceName}_results`);

    await this.createQueue(`development_${this.serviceName}_tasks`);
    await this.createQueue(`development_${this.serviceName}_results`);
  }

  async readFirstTaskMessage() {
    const message: RedisSMQ.QueueMessage | {} = await this.rsmq.receiveMessageAsync({
      qname: `development_${this.serviceName}_tasks`,
    });
    const queueMessage = message as QueueMessage;

    if (!queueMessage.id) {
      return undefined;
    }

    await this.rsmq.deleteMessageAsync({
      qname: `development_${this.serviceName}_tasks`,
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
      this.redisClient = Redis.createClient(redisUrl);
      this.redisSMQ = new RedisSMQ({ client: this.redisClient });
      await this.resetQueue();
    }
    const start = new Promise<void>(resolve => {
      this.server = this.app.listen(this.port, () => {
        this.actualPort = (this.server!.address() as any).port;
        resolve();
      });
    });
    return start;
  }

  async stop() {
    this.redisClient?.end(true);
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server!.close(err => {
          if (err) {
            reject(err);
            return;
          }
          this.server = undefined;
          // Give the OS time to fully release the port
          setTimeout(resolve, 500);
        });
      });
    }
  }

  async sendFinishedMessage(task: ResultsMessage) {
    try {
      await this.rsmq.sendMessageAsync({
        qname: `development_${this.serviceName}_results`,
        message: JSON.stringify(task),
      });
    } catch (err) {
      console.log(err);
    }
  }

  reset() {
    this.files = [];
    this.filesNames = [];
    this.materials = [];
    this.errorSimulation = {};
  }

  simulateConnectionError(type: string) {
    this.errorSimulation = { type };
  }

  simulateServiceError(status: number) {
    this.errorSimulation = { status };
  }

  simulateSuccess() {
    this.errorSimulation = {};
  }
}
