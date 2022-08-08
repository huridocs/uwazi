module.exports = async () => {
  const { createMongoInstance } = await import('./api/utils/createMongoInstance.js');
  const { downloadRedis } = await import('./api/utils/downloadRedis.js');
  const mongod = await createMongoInstance();
  await mongod.stop();
  downloadRedis();
};
