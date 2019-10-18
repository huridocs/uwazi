"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.expectedKey = exports.recoveryUserId = exports.userId = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _sha = _interopRequireDefault(require("crypto-js/sha256"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const userId = _testing_db.default.id();exports.userId = userId;
const recoveryUserId = _testing_db.default.id();exports.recoveryUserId = recoveryUserId;
const expectedKey = (0, _sha.default)(`recovery@email.com${2000}`).toString();exports.expectedKey = expectedKey;var _default =

{
  users: [
  { _id: userId, password: 'password', username: 'username', email: 'test@email.com', role: 'admin' },
  { _id: recoveryUserId, password: 'anotherpassword', username: 'anotherusername', email: 'recovery@email.com', role: 'editor' }],

  passwordrecoveries: [
  { _id: _testing_db.default.id(), key: expectedKey, user: recoveryUserId }],

  settings: [
  { site_name: 'Uwazi instance' // eslint-disable-line camelcase
  }] };exports.default = _default;