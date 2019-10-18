"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const schema = new _mongoose.default.Schema({
  key: String,
  user: { type: _mongoose.default.Schema.Types.ObjectId, ref: 'users' } });var _default =


(0, _odm.default)('passwordrecoveries', schema);exports.default = _default;