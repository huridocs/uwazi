"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.disconnect = exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _database = _interopRequireDefault(require("../config/database.js"));
var _elasticIndexes = _interopRequireDefault(require("../config/elasticIndexes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

_mongoose.default.Promise = Promise;

const index = 'development';
_elasticIndexes.default.index = _elasticIndexes.default[index];var _default =

() => new Promise((resolve, reject) => {
  _mongoose.default.connect(_database.default[index]);
  const db = _mongoose.default.connection;
  db.on('error', reject);
  db.once('open', () => {
    resolve();
  });
});exports.default = _default;

const disconnect = () => _mongoose.default.disconnect();exports.disconnect = disconnect;