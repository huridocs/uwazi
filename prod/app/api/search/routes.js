"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _entities = _interopRequireDefault(require("../entities"));
var _search = _interopRequireDefault(require("./search"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const parseQueryProperty = (query, property) => query[property] ? JSON.parse(query[property]) : query[property];var _default =

app => {
  app.get('/api/search/count_by_template',
  _utils.validation.validateRequest(_joi.default.object().keys({
    templateId: _joi.default.string().required() }).
  required(), 'query'),
  (req, res, next) => _entities.default.countByTemplate(req.query.templateId).
  then(results => res.json(results)).
  catch(next));

  app.get('/api/search',

  _utils.validation.validateRequest(_joi.default.object().keys({
    filters: _joi.default.string(),
    types: _joi.default.string(),
    _types: _joi.default.string(),
    fields: _joi.default.string(),
    allAggregations: _joi.default.string(),
    userSelectedSorting: _joi.default.string(),
    aggregations: _joi.default.string(),
    order: _joi.default.string(),
    sort: _joi.default.string(),
    limit: _joi.default.string(),
    searchTerm: _joi.default.string().allow(''),
    includeUnpublished: _joi.default.any(),
    treatAs: _joi.default.string(),
    unpublished: _joi.default.any(),
    geolocation: _joi.default.boolean() }),
  'query'),

  (req, res, next) => {
    req.query.filters = parseQueryProperty(req.query, 'filters');
    req.query.types = parseQueryProperty(req.query, 'types');
    req.query.fields = parseQueryProperty(req.query, 'fields');
    req.query.aggregations = parseQueryProperty(req.query, 'aggregations');

    const action = req.query.geolocation ? 'searchGeolocations' : 'search';

    return _search.default[action](req.query, req.language, req.user).
    then(results => res.json(results)).
    catch(next);
  });


  app.get('/api/search_snippets',
  _utils.validation.validateRequest(_joi.default.object().keys({
    searchTerm: _joi.default.string().allow(''),
    id: _joi.default.string() }),
  'query'),
  (req, res, next) => _search.default.searchSnippets(req.query.searchTerm, req.query.id, req.language).
  then(results => res.json(results)).
  catch(next));

  app.get('/api/search/unpublished', (0, _authMiddleware.default)(['admin', 'editor']), (req, res, next) => {
    _search.default.getUploadsByUser(req.user, req.language).
    then(response => res.json({ rows: response })).
    catch(next);
  });
};exports.default = _default;