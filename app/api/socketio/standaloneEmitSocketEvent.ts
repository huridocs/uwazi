import { Emitter } from '@socket.io/redis-emitter';
import { createClient } from 'redis';
import { config } from 'api/config';

const emitSocketEvent = async (
  event: string,
  tenant: string = '',
  data: string | undefined = undefined
) =>
  new Promise((resolve, reject) => {
    const redisClient = createClient({ host: config.redis.host, port: config.redis.port });

    redisClient.on('error', reject);
    redisClient.on('end', resolve);

    redisClient.on('ready', () => {
      const io = new Emitter(redisClient);
      if (tenant === '') {
        io.emit(event, data);
      } else {
        io.to(tenant).emit(event, data);
      }
      redisClient.quit();
    });
  });

export { emitSocketEvent };
