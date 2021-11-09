import { spawn } from 'child_process';

export class RedisServer {
  server: any;

  port: number;

  pathToBin: string;

  constructor(port = 6379) {
    this.pathToBin = 'redis-bin/redis-stable/src/redis-server';
    this.port = port;
  }

  start() {
    try {
      this.server = spawn(this.pathToBin, ['--port', this.port.toString()]);
    } catch (err) {
      console.log(err);
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve, _reject) => {
      this.server.on('close', () => {
        resolve();
      });
      this.server.kill('SIGINT');
    });
  }
}
