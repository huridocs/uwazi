"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.firstTemplate = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const firstTemplate = _testing_db.default.id();exports.firstTemplate = firstTemplate;var _default =

{
  activitylogs: [
  { method: 'POST', url: '/api/entities', query: '{}', body: '{"_id":"123","title":"Hello"}', time: 1560770143000, username: 'admin' }],


  templates: [
  { _id: firstTemplate, name: 'Existing Template' }] };exports.default = _default;