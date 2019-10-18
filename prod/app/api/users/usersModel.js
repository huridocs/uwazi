"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const userSchema = new _mongoose.default.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, select: false, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, unique: false, required: true },
  failedLogins: { type: Number, required: false, select: false },
  accountLocked: { type: Boolean, select: false },
  accountUnlockCode: { type: String, select: false } });var _default =


(0, _odm.default)('users', userSchema);exports.default = _default;