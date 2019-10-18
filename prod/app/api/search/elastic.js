"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _elasticsearch = _interopRequireDefault(require("elasticsearch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const elastic = new _elasticsearch.default.Client({
  host: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });var _default =


elastic;exports.default = _default;