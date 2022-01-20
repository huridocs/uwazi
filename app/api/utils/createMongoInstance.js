import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';

//eslint-disable-next-line consistent-return
export const createMongoInstance = async (dbName = '', transactional = false) => {
  try {
    return !transactional
      ? await MongoMemoryServer.create({ instance: { dbName } })
      : await MongoMemoryReplSet.create({
          autoStart: true,
          instanceOpts: [{ storageEngine: 'wiredTiger' }, { storageEngine: 'wiredTiger' }],
          replSet: { count: 1, dbName, name: 'rs' },
          debug: true,
        });
  } catch (e) {
    if (e.message.match('valid binary path')) {
      e.message = `You are using an invalid mongodb version or do not have the binaries installed,
reinstall by removing node_modules and executing yarn install\n\n${e.message}`;
      throw e;
    }
  }
};
