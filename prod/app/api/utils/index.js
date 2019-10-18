"use strict";Object.defineProperty(exports, "__esModule", { value: true });Object.defineProperty(exports, "createError", { enumerable: true, get: function () {return _Error.default;} });Object.defineProperty(exports, "handleError", { enumerable: true, get: function () {return _handleError.default;} });exports.validation = void 0;var _validateRequest = _interopRequireDefault(require("./validateRequest"));
var _Error = _interopRequireDefault(require("./Error"));
var _handleError = _interopRequireDefault(require("./handleError"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const validation = {
  validateRequest: _validateRequest.default };exports.validation = validation;