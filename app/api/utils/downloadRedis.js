/* eslint-disable no-console */
//eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

export const downloadRedis = () => {
  const redisVersion = execSync('cat .redis_version').toString().replace('\n', '');
  const pathToBin = path.join(__dirname, '../../../redis-bin/redis-stable/src/redis-server');
  console.log(pathToBin);
  if (fs.existsSync(pathToBin)) {
    return;
  }
  console.log('Downloading redis...');

  execSync('mkdir -p redis-bin', { stdio: 'ignore' });
  execSync(
    `cd redis-bin && curl -O http://download.redis.io/releases/redis-${redisVersion}.tar.gz`,
    { stdio: 'ignore' }
  );
  execSync(`cd redis-bin && tar xzvf redis-${redisVersion}.tar.gz`, { stdio: 'ignore' });
  execSync(`cd redis-bin && mv redis-${redisVersion} redis-stable`, { stdio: 'ignore' });

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
