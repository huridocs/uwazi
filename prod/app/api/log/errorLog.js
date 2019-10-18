"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.createErrorLog = void 0;var _winston = _interopRequireDefault(require("winston"));
var _GrayLogTransport = _interopRequireDefault(require("./GrayLogTransport"));
var _formatMessage = _interopRequireDefault(require("./formatMessage"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let DATABASE_NAME = 'localhost';
let LOGS_DIR = './log';

const formatter = _winston.default.format.printf(info => (0, _formatMessage.default)(info, DATABASE_NAME));

const createFileTransport = () => new _winston.default.transports.File({
  filename: `${LOGS_DIR}/error.log`,
  handleExceptions: true,
  level: 'error',
  format: _winston.default.format.combine(
  _winston.default.format.timestamp(),
  formatter) });



const consoleTransport = new _winston.default.transports.Console({
  handleExceptions: true,
  level: 'error',
  format: _winston.default.format.combine(
  _winston.default.format.timestamp(),
  formatter) });



const createErrorLog = () => {
  DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
  LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : './log';

  const logger = _winston.default.createLogger({
    transports: [createFileTransport(), consoleTransport] });


  if (process.env.USE_GRAYLOG) {
    logger.add(new _GrayLogTransport.default({
      format: _winston.default.format.combine(
      _winston.default.format.timestamp(),
      formatter),

      instance_name: DATABASE_NAME,
      server: process.env.USE_GRAYLOG }));

  }

  return logger;
};exports.createErrorLog = createErrorLog;var _default =

createErrorLog();exports.default = _default;