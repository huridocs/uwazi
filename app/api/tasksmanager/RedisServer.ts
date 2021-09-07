import { execSync } from 'child_process';
import fs from 'fs';
import Server from 'redis-server';

export class RedisServer {
  server: Server;

  pathToBin: string;

  constructor() {
    this.pathToBin = 'redis/redis-stable/src/redis-server';
    this.downloadRedis();
  }

  downloadRedis() {
    if (fs.existsSync(this.pathToBin)) {
      return;
    }

    execSync(
      `mkdir redis && cd redis
       curl -O http://download.redis.io/redis-stable.tar.gz
       tar xzvf redis-stable.tar.gz`,
      { stdio: 'inherit' }
    );

    execSync('cd redis && tar xzvf redis-stable.tar.gz');

    execSync(
      `cd redis
       cd redis-stable
       make`
    );
  }

  async start() {
    this.server = new Server({
      port: 6379,
      bin: this.pathToBin,
    });
    await this.server.open();
  }

  async stop() {
    await this.server.close();
  }
}
