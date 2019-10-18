"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const propertiesSchema = new _mongoose.default.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  relationType: String,
  inheritProperty: String,
  name: String,
  filter: Boolean,
  inherit: Boolean,
  noLabel: Boolean,
  fullWidth: Boolean,
  defaultfilter: Boolean,
  required: Boolean,
  sortable: Boolean,
  showInCard: Boolean,
  prioritySorting: Boolean,
  style: String,
  nestedProperties: [String] });


const commonPropertiesSchema = new _mongoose.default.Schema({
  isCommonProperty: Boolean,
  label: String,
  name: String,
  type: String,
  prioritySorting: Boolean });


const templateSchema = new _mongoose.default.Schema({
  name: String,
  color: { type: String, default: '' },
  default: Boolean,
  properties: [propertiesSchema],
  commonProperties: [commonPropertiesSchema] });var _default =


(0, _odm.default)('templates', templateSchema);exports.default = _default;