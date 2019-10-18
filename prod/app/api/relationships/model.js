"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const relationshipsSchema = new _mongoose.default.Schema({
  entity: { type: String, index: true },
  hub: { type: _mongoose.default.Schema.Types.ObjectId, index: true },
  sharedId: { type: _mongoose.default.Schema.Types.ObjectId, index: true },
  template: { type: _mongoose.default.Schema.Types.ObjectId, ref: 'relationTypes', index: true },
  metadata: _mongoose.default.Schema.Types.Mixed,
  filename: String,
  range: {
    start: Number,
    end: Number,
    text: String } });var _default =



(0, _odm.default)('connections', relationshipsSchema);exports.default = _default;