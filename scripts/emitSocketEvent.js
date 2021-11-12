import { Emitter } from '@socket.io/redis-emitter';
import { createClient } from 'redis';
import { config } from '../app/api/config';

const { tenant, event } = require('yargs')
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'tenant to send event to, "all" sends to all tenants.',
  })
  .option('event', {
    alias: 'e',
    type: 'string',
    describe: 'event name to sent to clients connected',
    choices: ['forceReconnect'],
  })
  .demandOption(['tenant', 'event'], '\n\n').argv;

const redisClient = createClient({ host: config.redis.host, port: config.redis.port });

redisClient.on('error', e => {
  throw e;
});

redisClient.on('ready', () => {
  const io = new Emitter(redisClient);
  if (tenant === 'all') {
    io.emit(event);
  } else {
    io.to(tenant).emit(event);
  }
  redisClient.quit();
});
