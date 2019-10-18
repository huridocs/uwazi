"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const propertiesSchema = new _mongoose.default.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  name: String,
  filter: Boolean,
  required: Boolean,
  sortable: Boolean,
  showInCard: Boolean,
  prioritySorting: Boolean,
  nestedProperties: [String] });


const templateSchema = new _mongoose.default.Schema({
  name: String,
  properties: [propertiesSchema] });var _default =


(0, _odm.default)('relationtypes', templateSchema);exports.default = _default;