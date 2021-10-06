import { execSync } from 'child_process';
import fs from 'fs';
import Server from 'redis-server';

export class RedisServer {
  server: Server;

  port: number;

  pathToBin: string;

  constructor(port = 6379) {
    this.pathToBin = 'redis/redis-stable/src/redis-server';
    this.downloadRedis();
    this.port = port;
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
      port: this.port,
      bin: this.pathToBin,
    });
    try {
      await this.server.open();
    } catch (err) {
      console.log(err);
    }
  }

  async stop() {
    await this.server.close();
  }
}
