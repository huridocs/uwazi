"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _settings = _interopRequireDefault(require("./settings"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.post('/api/settings',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId(),
    __v: _joi.default.number(),
    project: _joi.default.string(),
    site_name: _joi.default.string().allow(''),
    contactEmail: _joi.default.string().allow(''),
    home_page: _joi.default.string().allow(''),
    private: _joi.default.boolean(),
    cookiepolicy: _joi.default.boolean(),
    mailerConfig: _joi.default.string().allow(''),
    publicFormDestination: _joi.default.string().allow(''),
    allowedPublicTemplates: _joi.default.array().items(
    _joi.default.string()),

    analyticsTrackingId: _joi.default.string().allow(''),
    matomoConfig: _joi.default.string().allow(''),
    dateFormat: _joi.default.string().allow(''),
    custom: _joi.default.any(),
    customCSS: _joi.default.string().allow(''),
    languages: _joi.default.array().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      key: _joi.default.string(),
      label: _joi.default.string(),
      rtl: _joi.default.boolean(),
      default: _joi.default.boolean() })),


    filters: _joi.default.array().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      id: _joi.default.string(),
      name: _joi.default.string(),
      items: _joi.default.any() })),


    links: _joi.default.array().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      localID: _joi.default.string(),
      title: _joi.default.string(),
      url: _joi.default.string() })),


    features: _joi.default.object().keys({
      semanticSearch: _joi.default.boolean() }) }).

  required()),
  (req, res, next) => {
    _settings.default.save(req.body).
    then(response => res.json(response)).
    catch(next);
  });


  app.get('/api/settings', (req, res, next) => {
    const adminUser = Boolean(req.user && req.user.role === 'admin');
    _settings.default.get(adminUser).
    then(response => res.json(response)).
    catch(next);
  });
};exports.default = _default;