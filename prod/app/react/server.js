"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _ServerRouter = _interopRequireDefault(require("./ServerRouter.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.get(/^\/(?!api(\/|$)).*$/, _ServerRouter.default);
};exports.default = _default;