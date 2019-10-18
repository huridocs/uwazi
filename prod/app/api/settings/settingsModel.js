"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _mongoose = _interopRequireDefault(require("mongoose"));
var _odm = _interopRequireDefault(require("../odm"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const languagesSchema = new _mongoose.default.Schema({
  key: String,
  label: String,
  rtl: Boolean,
  default: Boolean });


const linksSchema = new _mongoose.default.Schema({
  title: String,
  url: String });


const filtersSchema = new _mongoose.default.Schema({
  id: String,
  name: String,
  items: _mongoose.default.Schema.Types.Mixed });


const featuresSchema = new _mongoose.default.Schema({
  semanticSearch: Boolean });


const settingsSchema = new _mongoose.default.Schema({
  project: String,
  site_name: String,
  contactEmail: String,
  publicFormDestination: { type: String, select: false },
  allowedPublicTemplates: [{ type: String }],
  home_page: String,
  private: Boolean,
  cookiepolicy: Boolean,
  languages: [languagesSchema],
  links: [linksSchema],
  filters: [filtersSchema],
  mailerConfig: String,
  analyticsTrackingId: String,
  matomoConfig: String,
  dateFormat: String,
  features: featuresSchema,
  custom: _mongoose.default.Schema.Types.Mixed,
  sync: _mongoose.default.Schema.Types.Mixed,
  evidencesVault: _mongoose.default.Schema.Types.Mixed,
  customCSS: String });var _default =


(0, _odm.default)('settings', settingsSchema);exports.default = _default;