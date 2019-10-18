"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));

var _utils = require("../utils");
var _settings = _interopRequireDefault(require("../settings"));
var _entities = _interopRequireDefault(require("../entities"));
var _pages = _interopRequireDefault(require("../pages"));

var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _translations = _interopRequireDefault(require("./translations"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.get('/api/translations', (req, res, next) => {
    _translations.default.get().
    then(response => res.json({ rows: response })).
    catch(next);
  });

  app.post(
  '/api/translations',

  (0, _authMiddleware.default)(),

  _utils.validation.validateRequest(_joi.default.object().
  keys({
    _id: _joi.default.objectId(),
    __v: _joi.default.number(),
    locale: _joi.default.string().required(),
    contexts: _joi.default.array().required().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      id: _joi.default.string(),
      label: _joi.default.string(),
      type: _joi.default.string(),
      values: _joi.default.object().pattern(/\w+/, _joi.default.string()) })) }).


  required()),

  (req, res, next) => {
    _translations.default.save(req.body).
    then(response => {
      response.contexts = _translations.default.prepareContexts(response.contexts);
      req.io.sockets.emit('translationsChange', response);
      res.json(response);
    }).
    catch(next);
  });


  app.post(
  '/api/translations/setasdeafult',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    key: _joi.default.string() }).
  required()),

  (req, res, next) => {
    _settings.default.setDefaultLanguage(req.body.key).
    then(response => {
      req.io.sockets.emit('updateSettings', response);
      res.json(response);
    }).
    catch(next);
  });


  app.post(
  '/api/translations/languages',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    key: _joi.default.string(),
    label: _joi.default.string(),
    rtl: _joi.default.boolean() }).
  required()),

  (req, res, next) => {
    Promise.all([
    _settings.default.addLanguage(req.body),
    _translations.default.addLanguage(req.body.key),
    _entities.default.addLanguage(req.body.key),
    _pages.default.addLanguage(req.body.key)]).

    then(([newSettings, newTranslations]) => {
      req.io.sockets.emit('updateSettings', newSettings);
      req.io.sockets.emit('translationsChange', newTranslations);
      res.json(newSettings);
    }).
    catch(next);
  });


  app.delete(
  '/api/translations/languages',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    key: _joi.default.string() }).
  required()),

  (req, res, next) => {
    Promise.all([
    _settings.default.deleteLanguage(req.query.key),
    _translations.default.removeLanguage(req.query.key),
    _entities.default.removeLanguage(req.query.key),
    _pages.default.removeLanguage(req.query.key)]).

    then(([newSettings, newTranslations]) => {
      req.io.sockets.emit('updateSettings', newSettings);
      req.io.sockets.emit('translationsChange', newTranslations);
      res.json(newSettings);
    }).
    catch(next);
  });

};exports.default = _default;