"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const pagesSchema = new _mongoose.default.Schema({
  title: String,
  language: String,
  sharedId: String,
  creationDate: { type: Number, select: false },
  metadata: new _mongoose.default.Schema({
    content: String,
    script: String }),

  user: { type: _mongoose.default.Schema.Types.ObjectId, ref: 'users', select: false } });var _default =


(0, _odm.default)('pages', pagesSchema);exports.default = _default;