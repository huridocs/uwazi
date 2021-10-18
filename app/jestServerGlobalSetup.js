import { createMongoInstance as checkMongoVersion } from './api/utils/createMongoInstance.js';
import { downloadRedis } from './api/utils/downloadRedis.js';

module.exports = async () => {
  const mongod = await checkMongoVersion();
  await mongod.stop();
  downloadRedis();
};
