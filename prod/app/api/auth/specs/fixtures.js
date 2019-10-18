"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _sha = _interopRequireDefault(require("crypto-js/sha256"));
var _bcrypt = _interopRequireDefault(require("bcrypt"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const oldPassword = (0, _sha.default)('oldPassword').toString();
const newPassword = _bcrypt.default.hashSync('newPassword', 10);var _default =


{
  users: [
  { password: oldPassword, username: 'oldUser', email: 'old@email.com' },
  { password: newPassword, username: 'newUser', email: 'new@email.com' }],

  settings: [
  { publicFormDestination: 'http://secret.place.io' }] };exports.default = _default;