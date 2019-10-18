"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.saveSchema = exports.metadataSchema = exports.iconSchema = void 0;var _joi = _interopRequireDefault(require("joi"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const dateRangeSchema = _joi.default.object().keys({
  from: _joi.default.number().allow([null]),
  to: _joi.default.number().allow([null]) }).
allow('');

const metadataSchema = _joi.default.object().keys().pattern(_joi.default.string().allow(''), _joi.default.alternatives().try(
_joi.default.number().allow('').allow(null),
_joi.default.string().allow('').allow(null),
dateRangeSchema,
_joi.default.array().items(_joi.default.object().keys({
  lat: _joi.default.number(),
  lon: _joi.default.number(),
  label: _joi.default.string().allow(null).allow('') })).
allow(''),
_joi.default.object().keys({
  label: _joi.default.string(),
  url: _joi.default.string() }).
allow(''),
_joi.default.array().items(_joi.default.alternatives().try(
_joi.default.number().allow(null),
_joi.default.string(),
dateRangeSchema)).
allow(''),
_joi.default.array().items(_joi.default.object().pattern(
_joi.default.string(),
_joi.default.array().items(_joi.default.string()))).
allow('')));exports.metadataSchema = metadataSchema;


const iconSchema = _joi.default.object().keys({
  _id: _joi.default.string().allow(null),
  label: _joi.default.string(),
  type: _joi.default.string() });exports.iconSchema = iconSchema;


const saveSchema = _joi.default.object().keys({
  _id: _joi.default.string(),
  __v: _joi.default.number(),
  language: _joi.default.string(),
  mongoLanguage: _joi.default.string(),
  sharedId: _joi.default.string(),
  title: _joi.default.string(),
  type: _joi.default.string(),
  template: _joi.default.string(),
  file: _joi.default.object().keys({
    originalname: _joi.default.string(),
    filename: _joi.default.string(),
    mimetype: _joi.default.string(),
    size: _joi.default.number(),
    language: _joi.default.string(),
    timestamp: _joi.default.number() }),

  fullText: _joi.default.any(),
  totalPages: _joi.default.number(),
  icon: iconSchema,
  toc: _joi.default.array().items(_joi.default.object().keys({
    _id: _joi.default.string(),
    label: _joi.default.string(),
    indentation: _joi.default.number(),
    range: _joi.default.object().keys({
      start: _joi.default.number(),
      end: _joi.default.number() }) })),


  attachments: _joi.default.array().items(_joi.default.object().keys({
    _id: _joi.default.string(),
    originalname: _joi.default.string(),
    filename: _joi.default.string(),
    mimetype: _joi.default.string(),
    size: _joi.default.number(),
    timestamp: _joi.default.number() })),

  creationDate: _joi.default.number(),
  processed: _joi.default.boolean(),
  uploaded: _joi.default.boolean(),
  published: _joi.default.boolean(),
  metadata: metadataSchema,
  pdfInfo: _joi.default.any(),
  user: _joi.default.string() }).
required();exports.saveSchema = saveSchema;