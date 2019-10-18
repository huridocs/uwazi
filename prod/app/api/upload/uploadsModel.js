"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _date = _interopRequireDefault(require("../utils/date.js"));

var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const uploadSchema = new _mongoose.default.Schema({
  originalname: String,
  filename: String,
  mimetype: String,
  size: Number,
  creationDate: { type: Number, default: _date.default.currentUTC } },
{ emitIndexErrors: true });

const Model = (0, _odm.default)('uploads', uploadSchema);var _default =

Model;exports.default = _default;