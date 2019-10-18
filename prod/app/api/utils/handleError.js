"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.prettifyError = exports.default = void 0;
var _debugLog = _interopRequireDefault(require("../log/debugLog"));
var _errorLog = _interopRequireDefault(require("../log/errorLog"));
var _ajv = _interopRequireDefault(require("ajv"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable prefer-template */

const prettifyError = (error, { req = {}, uncaught = false } = {}) => {
  let result = error;

  if (error instanceof Error) {
    result = { code: 500, message: error.stack };
  }

  if (error instanceof _ajv.default.ValidationError) {
    result = { code: 422, message: error.message, validations: error.errors };
  }

  if (error.name === 'MongoError') {
    result.code = 500;
  }

  if (error.message && error.message.match(/Cast to ObjectId failed for value/)) {
    result.code = 400;
  }

  if (error.message && error.message.match(/rison decoder error/)) {
    result.code = 400;
  }

  if (uncaught) {
    result.message = `uncaught exception or unhandled rejection, Node process finished !!\n ${result.message}`;
  }

  if (req.body && req.body.password) {
    req.body.password = '########';
  }

  if (req.body && req.body.username) {
    req.body.username = '########';
  }

  const errorMessage = (req.originalUrl ? `\nurl: ${req.originalUrl}` : '') + (
  req.body && Object.keys(req.body).length ? `\nbody: ${JSON.stringify(req.body, null, ' ')}` : '') + (
  req.query && Object.keys(req.query).length ? `\nquery: ${JSON.stringify(req.query, null, ' ')}` : '') +
  `\n${result.message || JSON.stringify(error.json)}`;

  result.prettyMessage = errorMessage;
  return result;
};exports.prettifyError = prettifyError;var _default =

(error, { req = {}, uncaught = false } = {}) => {
  const responseToClientError = error.json;

  if (responseToClientError) {
    return false;
  }

  const result = prettifyError(error, { req, uncaught });

  if (result.code === 500) {
    _errorLog.default.error(result.prettyMessage);
  }

  if (result.code === 400) {
    _debugLog.default.debug(result.prettyMessage);
  }

  return result;
};exports.default = _default;