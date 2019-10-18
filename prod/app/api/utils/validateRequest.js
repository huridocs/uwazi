"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _joiObjectid = _interopRequireDefault(require("joi-objectid"));
var _Error = _interopRequireDefault(require("./Error"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

_joi.default.objectId = (0, _joiObjectid.default)(_joi.default);var _default =

(schema, propTovalidate = 'body') => (req, res, next) => {
  const result = _joi.default.validate(req[propTovalidate], schema);
  if (result.error) {
    next((0, _Error.default)(result.error.toString(), 400));
  }

  if (!result.error) {
    next();
  }
};exports.default = _default;