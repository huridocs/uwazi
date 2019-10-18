"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const syncSchema = new _mongoose.default.Schema({
  lastSync: Number });var _default =


_mongoose.default.model('syncs', syncSchema);exports.default = _default;