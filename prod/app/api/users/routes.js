"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));

var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _users = _interopRequireDefault(require("./users"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const getDomain = req => `${req.protocol}://${req.get('host')}`;var _default =
app => {
  app.post(
  '/api/users',

  (0, _authMiddleware.default)(['admin', 'editor']),

  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId().required(),
    __v: _joi.default.number(),
    username: _joi.default.string(),
    email: _joi.default.string(),
    password: _joi.default.string(),
    role: _joi.default.string().valid('admin', 'editor') }).
  required()),

  (req, res, next) => {
    _users.default.save(req.body, req.user, getDomain(req)).
    then(response => res.json(response)).
    catch(next);
  });

  app.post('/api/users/new',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    username: _joi.default.string().required(),
    email: _joi.default.string().required(),
    password: _joi.default.string(),
    role: _joi.default.string().valid('admin', 'editor').required() }).
  required()),
  (req, res, next) => {
    _users.default.newUser(req.body, getDomain(req)).
    then(response => res.json(response)).
    catch(next);
  });

  app.post(
  '/api/unlockaccount',
  _utils.validation.validateRequest(_joi.default.object().keys({
    username: _joi.default.string().required(),
    code: _joi.default.string().required() }).
  required()),
  (req, res, next) => {
    _users.default.unlockAccount(req.body).
    then(() => res.json('OK')).
    catch(next);
  });


  app.post(
  '/api/recoverpassword',
  _utils.validation.validateRequest(_joi.default.object().keys({
    email: _joi.default.string().required() }).
  required()),
  (req, res, next) => {
    _users.default.recoverPassword(req.body.email, getDomain(req)).
    then(() => res.json('OK')).
    catch(next);
  });


  app.post('/api/resetpassword',
  _utils.validation.validateRequest(_joi.default.object().keys({
    key: _joi.default.string().required(),
    password: _joi.default.string().required() }).
  required()),
  (req, res, next) => {
    _users.default.resetPassword(req.body).
    then(response => res.json(response)).
    catch(next);
  });


  app.get('/api/users', (0, _authMiddleware.default)(), (req, res, next) => {
    _users.default.get().
    then(response => res.json(response)).
    catch(next);
  });

  app.delete('/api/users',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string().required() }).
  required(), 'query'),
  (req, res, next) => {
    _users.default.delete(req.query._id, req.user).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;