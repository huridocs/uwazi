"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const searchSchema = new _mongoose.default.Schema({
  language: String,
  searchTerm: String,
  status: String,
  documents: [{
    _id: false,
    sharedId: String,
    status: String }],

  query: Object,
  creationDate: Number });var _default =


(0, _odm.default)('semanticsearches', searchSchema);exports.default = _default;