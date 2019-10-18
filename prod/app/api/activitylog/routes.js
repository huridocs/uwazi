"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _activitylog = _interopRequireDefault(require("./activitylog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.get(
  '/api/activitylog',

  (0, _authMiddleware.default)(['admin']),

  _utils.validation.validateRequest(_joi.default.object().keys({
    user: _joi.default.objectId(),
    username: _joi.default.string(),
    time: _joi.default.object().keys({
      from: _joi.default.number(),
      to: _joi.default.number() }),

    limit: _joi.default.number(),
    method: _joi.default.array().items(_joi.default.string()),
    search: _joi.default.string() }).
  required()),

  (req, res, next) => {
    req.query.method = req.query.method ? JSON.parse(req.query.method) : req.query.method;
    req.query.time = req.query.time ? JSON.parse(req.query.time) : req.query.time;
    return _activitylog.default.get(req.query).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;