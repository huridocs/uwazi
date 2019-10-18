"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const resultSchema = new _mongoose.default.Schema({
  sharedId: String,
  searchId: _mongoose.default.Schema.Types.ObjectId,
  status: String,
  averageScore: Number,
  results: [{
    text: String,
    score: Number,
    page: String }] });var _default =



(0, _odm.default)('semanticsearchresults', resultSchema);exports.default = _default;