"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _contact = _interopRequireDefault(require("./contact"));
var _utils = require("../utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.post(
  '/api/contact',
  _utils.validation.validateRequest(_joi.default.object().keys({
    email: _joi.default.string().required(),
    name: _joi.default.string().required(),
    message: _joi.default.string().required() }).
  required()),
  (req, res, next) => _contact.default.sendMessage(req.body).
  then(() => res.json('ok')).
  catch(next));
};exports.default = _default;