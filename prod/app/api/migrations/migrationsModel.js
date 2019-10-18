"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const entitySchema = new _mongoose.default.Schema({
  delta: Number,
  name: String,
  description: String,
  migrationDate: { type: Date, default: Date.now } });


const Model = (0, _odm.default)('migrations', entitySchema);var _default =

Model;exports.default = _default;