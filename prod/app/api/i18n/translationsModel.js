"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const contextSchema = new _mongoose.default.Schema({
  id: String,
  label: String,
  type: String,
  values: [{
    key: String,
    value: String }] });



const translationSchema = new _mongoose.default.Schema({
  locale: String,
  contexts: [contextSchema] });var _default =


(0, _odm.default)('translations', translationSchema);exports.default = _default;