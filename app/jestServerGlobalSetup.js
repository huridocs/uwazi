import { createMongoInstance as checkMongoVersion } from './api/utils/createMongoInstance.js';

module.exports = async () => {
  const mongod = await checkMongoVersion();
  await mongod.stop();
};
