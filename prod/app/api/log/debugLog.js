"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _winston = _interopRequireDefault(require("winston"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : './log';var _default =

_winston.default.createLogger({
  transports: [
  new _winston.default.transports.File({
    filename: `${LOGS_DIR}/debug.log`,
    json: false,
    level: 'debug' })] });exports.default = _default;