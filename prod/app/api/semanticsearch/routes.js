"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _semanticSearch = _interopRequireDefault(require("./semanticSearch"));
var _utils = require("../utils");
var _handleError = _interopRequireDefault(require("../utils/handleError"));
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _workerManager = _interopRequireDefault(require("./workerManager"));
var _updateNotifier = _interopRequireDefault(require("./updateNotifier"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}


_workerManager.default.on('searchError', (searchId, error) => {
  (0, _handleError.default)(error);
});var _default =

app => {
  app.post('/api/semantic-search',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchTerm: _joi.default.string().required(),
    documents: _joi.default.array().items(_joi.default.string()),
    query: _joi.default.object() }).
  required()),
  (req, res, next) => {
    _semanticSearch.default.create(req.body, req.language, req.user).
    then(results => res.json(results)).
    catch(next);
  });


  app.get('/api/semantic-search',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchId: _joi.default.string(),
    limit: _joi.default.number().min(0),
    skip: _joi.default.number().min(0),
    threshold: _joi.default.number().min(0),
    minRelevantSentences: _joi.default.number().min(0) }),
  'query'),
  (req, res, next) => {
    if (!req.query.searchId) {
      return _semanticSearch.default.getAllSearches().
      then(results => res.json(results)).
      catch(next);
    }

    const args = {
      limit: Number(req.query.limit || 30),
      skip: Number(req.query.skip || 0),
      threshold: Number(req.query.threshold || 0.4),
      minRelevantSentences: Number(req.query.minRelevantSentences || 5) };

    return _semanticSearch.default.getSearch(req.query.searchId, args).
    then(search => res.json(search)).
    catch(next);
  });


  app.get('/api/semantic-search/list',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchId: _joi.default.string(),
    threshold: _joi.default.number().min(0).required(),
    minRelevantSentences: _joi.default.number().min(0).required() }),
  'query'),
  (req, res, next) => {
    const _req$query = req.query,{ searchId } = _req$query,query = _objectWithoutProperties(_req$query, ["searchId"]);
    const args = _objectSpread({},
    query, {
      threshold: Number(req.query.threshold),
      minRelevantSentences: Number(req.query.minRelevantSentences) });

    _semanticSearch.default.listSearchResultsDocs(searchId, args).
    then(search => res.json(search)).
    catch(next);
  });


  app.delete('/api/semantic-search',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchId: _joi.default.string() }),
  'query'),
  (req, res, next) => {
    _semanticSearch.default.deleteSearch(req.query.searchId).
    then(search => res.json(search)).
    catch(next);
  });

  app.post('/api/semantic-search/stop',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchId: _joi.default.string() }),
  'query'),
  (req, res, next) => {
    _semanticSearch.default.stopSearch(req.query.searchId).
    then(search => res.json(search)).
    catch(next);
  });

  app.post('/api/semantic-search/resume',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchId: _joi.default.string() }),
  'query'),
  (req, res, next) => {
    _semanticSearch.default.resumeSearch(req.query.searchId).
    then(search => res.json(search)).
    catch(next);
  });

  app.get('/api/semantic-search/by-document/:sharedId',
  (0, _authMiddleware.default)(),
  (req, res, next) => {
    _semanticSearch.default.getSearchesByDocument(req.params.sharedId).
    then(searches => res.json(searches)).
    catch(next);
  });
  app.post('/api/semantic-search/notify-updates',
  (0, _authMiddleware.default)(),
  (req, res) => {
    _updateNotifier.default.addRequest(req);
    res.json({ ok: true });
  });
};exports.default = _default;

_workerManager.default.on('searchUpdated',
async (searchId, updates) => _updateNotifier.default.notifySearchUpdate(searchId, updates));