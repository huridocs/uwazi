/* eslint-disable import/no-extraneous-dependencies */
import mongoose from 'mongoose';
import pow from 'mongodb_fixtures';

import MongodbMemoryServer from 'mongodb-memory-server';

mongoose.Promise = Promise;
const testingDB = {};

testingDB.id = id => pow.createObjectId(id);

let connected = false;
let db;
let mongod;

const initMongoServer = () => {
  mongod = new MongodbMemoryServer();
  return mongod.getConnectionString()
  .then((uri) => {
    connected = true;
    db = pow.connect(uri);
    testingDB.clear = db.clear.bind(db);
    return mongoose.connect(uri, { useMongoClient: true });
  });
};

testingDB.connect = () => {
  if (connected) {
    return Promise.resolve();
  }
  return initMongoServer();
};

testingDB.clearAllAndLoad = fixtures => testingDB.connect()
.then(() => new Promise((resolve, reject) => {
  db.clearAllAndLoad(fixtures, (error) => {
    if (error) {
      reject(error);
    }
    resolve();
  });
}));

testingDB.disconnect = () => new Promise((resolve) => {
  connected = false;
  mongoose.disconnect()
  .then(() => {
    if (mongod) {
      return mongod.stop();
    }
    return Promise.resolve();
  })
  .then(() => {
    if (db) {
      return db.close(resolve);
    }
    return Promise.resolve();
  });
});

export default testingDB;
