"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));

var _utils = require("../utils");

var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _pages = _interopRequireDefault(require("./pages"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _default =

app => {
  app.post(
  '/api/pages',

  (0, _authMiddleware.default)(),

  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId(),
    __v: _joi.default.number(),
    sharedId: _joi.default.string(),
    title: _joi.default.string().required(),
    language: _joi.default.string(),
    metadata: _joi.default.object().keys({
      _id: _joi.default.objectId(),
      content: _joi.default.string().allow(''),
      script: _joi.default.string().allow('') }) }).

  required()),

  (req, res, next) => _pages.default.save(req.body, req.user, req.language).
  then(response => res.json(response)).
  catch(next));


  app.get(
  '/api/pages',

  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string() }).
  required(), 'query'),

  (req, res, next) => {
    _pages.default.get(_objectSpread({}, req.query, { language: req.language })).
    then(res.json.bind(res)).
    catch(next);
  });


  app.get(
  '/api/page',

  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string() }).
  required(), 'query'),

  (req, res, next) => {
    _pages.default.getById(req.query.sharedId, req.language).
    then(res.json.bind(res)).
    catch(next);
  });


  app.delete(
  '/api/pages',
  (0, _authMiddleware.default)(),

  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string() }).
  required(), 'query'),

  (req, res, next) => {
    _pages.default.delete(req.query.sharedId).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;