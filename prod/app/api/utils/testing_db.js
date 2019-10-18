"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
var _mongodb_fixtures = _interopRequireDefault(require("mongodb_fixtures"));

var _mongodbMemoryServer = _interopRequireDefault(require("mongodb-memory-server"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable import/no-extraneous-dependencies */

_mongoose.default.Promise = Promise;
const testingDB = {};

testingDB.id = id => _mongodb_fixtures.default.createObjectId(id);

let connected = false;
let db;
let mongod;

const initMongoServer = () => {
  mongod = new _mongodbMemoryServer.default();
  return mongod.getConnectionString().
  then(uri => {
    connected = true;
    db = _mongodb_fixtures.default.connect(uri);
    testingDB.clear = db.clear.bind(db);
    return _mongoose.default.connect(uri, {});
  });
};

testingDB.connect = () => {
  if (connected) {
    return Promise.resolve();
  }
  return initMongoServer().then(() => {
    testingDB.mongodb = _mongoose.default.connections[0].db;
  });
};

testingDB.clearAllAndLoad = fixtures => testingDB.connect().
then(() => new Promise((resolve, reject) => {
  db.clearAllAndLoad(fixtures, error => {
    if (error) {
      reject(error);
    }
    resolve();
  });
}));

testingDB.disconnect = () => new Promise(resolve => {
  connected = false;
  _mongoose.default.disconnect().
  then(() => {
    if (mongod) {
      return mongod.stop();
    }
    return Promise.resolve();
  }).
  then(() => {
    if (db) {
      return db.close(resolve);
    }
    return Promise.resolve();
  });
});var _default =

testingDB;exports.default = _default;