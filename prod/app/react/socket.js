"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.reconnectSocket = exports.default = void 0;var _socket = _interopRequireDefault(require("socket.io-client"));
var _utils = require("./utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let socket = { on: () => {} };
if (_utils.isClient) {
  socket = (0, _socket.default)();
}var _default =

socket;exports.default = _default;

const reconnectSocket = () => {
  socket.disconnect();
  socket.connect();
};exports.reconnectSocket = reconnectSocket;