"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const dictionarySchema = new _mongoose.default.Schema({
  name: String,
  values: [{
    id: String,
    label: { type: String },
    values: _mongoose.default.Schema.Types.Mixed }] });var _default =



(0, _odm.default)('dictionaries', dictionarySchema);exports.default = _default;