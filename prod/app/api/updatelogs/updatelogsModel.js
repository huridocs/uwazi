"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const updateLogSchema = new _mongoose.default.Schema({
  timestamp: Number,
  namespace: String,
  mongoId: { type: _mongoose.default.Schema.Types.ObjectId, index: true },
  deleted: Boolean });


const Model = _mongoose.default.model('updatelogs', updateLogSchema);var _default =
Model;exports.default = _default;