/* eslint-disable no-console */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const downloadRedis = () => {
  const pathToBin = path.join(__dirname, '../../../redis-bin/redis-stable/src/redis-server');
  console.log(pathToBin);
  if (fs.existsSync(pathToBin)) {
    return;
  }
  console.log('Downloading redis...');
  execSync(
    `mkdir redis-bin && cd redis-bin
       curl -O http://download.redis.io/redis-stable.tar.gz
       tar xzvf redis-stable.tar.gz`,
    { stdio: 'ignore' }
  );

  execSync('cd redis-bin && tar xzvf redis-stable.tar.gz', { stdio: 'ignore' });
  console.log('Downloading redis... Done');
  console.log('Installing redis...');
  execSync(
    `cd redis-bin &&
       cd redis-stable &&
       make distclean &&
       make`,
    { stdio: 'ignore' }
  );
  console.log('Installing redis... Done');
};
