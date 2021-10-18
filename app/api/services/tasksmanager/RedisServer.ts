import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export class RedisServer {
  server: any;

  port: number;

  pathToBin: string;

  redisFolder: string;

  constructor(port = 6379) {
    this.redisFolder = path.join(__dirname, 'redis-bin');
    this.pathToBin = path.join(this.redisFolder, 'redis-stable/src/redis-server');
    this.downloadRedis();
    this.port = port;
  }

  downloadRedis() {
    if (fs.existsSync(this.pathToBin)) {
      return;
    }

    execSync(
      `mkdir ${this.redisFolder} && cd ${this.redisFolder}
       curl -O http://download.redis.io/redis-stable.tar.gz
       tar xzvf redis-stable.tar.gz`,
      { stdio: 'inherit' }
    );

    execSync(`cd ${this.redisFolder} && tar xzvf redis-stable.tar.gz`);

    execSync(
      `cd ${this.redisFolder} &&
       cd redis-stable &&
       make`,
      { stdio: 'inherit' }
    );
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
