/* eslint-disable import/no-extraneous-dependencies */
import mongoose from 'mongoose';
import pow from 'mongodb_fixtures';

import MongodbMemoryServer from 'mongodb-memory-server';

mongoose.Promise = Promise;
mongoose.set('useFindAndModify', false);
const testingDB = {};

testingDB.id = id => pow.createObjectId(id);

let connected = false;
let db;
let mongod;

const initMongoServer = () => {
  mongod = new MongodbMemoryServer();
  return mongod.getConnectionString().then(uri => {
    connected = true;
    db = pow.connect(uri.substring(0, uri.length - 1));
    testingDB.clear = db.clear.bind(db);
    return mongoose.connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    });
  });
};

testingDB.connect = () => {
  if (connected) {
    return Promise.resolve();
  }
  return initMongoServer().then(() => {
    testingDB.mongodb = mongoose.connections[0].db;
  });
};

testingDB.clearAllAndLoad = fixtures =>
  testingDB.connect().then(
    () =>
      new Promise((resolve, reject) => {
        db.clearAllAndLoad(fixtures, error => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      })
  );

testingDB.disconnect = () =>
  new Promise(resolve => {
    connected = false;
    mongoose
      .disconnect()
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
