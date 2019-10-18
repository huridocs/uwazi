"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _relationships = _interopRequireDefault(require("./relationships.js"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}var _default =

app => {
  app.post('/api/relationships/bulk',
  (0, _authMiddleware.default)(['admin', 'editor']),
  // validation.validateRequest(Joi.object().keys({
  //   save: Joi.array().items(
  //     Joi.array().items(
  //       Joi.object().keys({
  //         _id: Joi.string(),
  //         __v: Joi.number(),
  //         entity: Joi.string(),
  //         entityData: Joi.object(),
  //         hub: Joi.string().allow(''),
  //         template: Joi.any(),
  //         metadata: Joi.any(),
  //         language: Joi.string(),
  //         range: Joi.object().keys({
  //           start: Joi.number(),
  //           end: Joi.number(),
  //           text: Joi.string()
  //         })
  //       })
  //     )
  //   ),
  //   delete: Joi.array().items(
  //     Joi.object().keys({
  //       entity: Joi.string(),
  //       _id: Joi.string()
  //     })
  //   )
  // }).required()),
  (req, res, next) => {
    _relationships.default.bulk(req.body, req.language).
    then(response => res.json(response)).
    catch(next);
  });


  app.post('/api/references',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId(),
    __v: _joi.default.number(),
    entity: _joi.default.string(),
    hub: _joi.default.string().allow(''),
    template: _joi.default.string(),
    metadata: _joi.default.any(),
    language: _joi.default.string(),
    range: _joi.default.object().keys({
      start: _joi.default.number(),
      end: _joi.default.number(),
      text: _joi.default.string() }) }).

  required()),
  (req, res, next) => {
    _relationships.default.save(req.body, req.language).
    then(response => res.json(response)).
    catch(next);
  });


  app.delete('/api/references',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId().required() }).
  required(), 'query'),
  (req, res, next) => {
    _relationships.default.delete({ _id: req.query._id }, req.language).
    then(response => res.json(response)).
    catch(next);
  });


  app.get('/api/references/by_document/',
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string().required() }).
  required(), 'query'),
  (req, res, next) => {
    const unpublished = Boolean(req.user && ['admin', 'editor'].includes(req.user.role));
    _relationships.default.getByDocument(req.query.sharedId, req.language, unpublished).
    then(response => res.json(response)).
    catch(next);
  });

  app.get('/api/references/group_by_connection/', (req, res, next) => {
    _relationships.default.getGroupsByConnection(req.query.sharedId, req.language, { excludeRefs: true, user: req.user }).
    then(response => {
      res.json(response);
    }).
    catch(next);
  });

  app.get('/api/references/search/',
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string().allow(''),
    filter: _joi.default.string().allow(''),
    limit: _joi.default.string().allow(''),
    sort: _joi.default.string().allow(''),
    order: _joi.default.string(),
    treatAs: _joi.default.string(),
    searchTerm: _joi.default.string().allow('') }),
  'query'),
  (req, res, next) => {
    req.query.filter = JSON.parse(req.query.filter || '{}');
    const _req$query = req.query,{ sharedId } = _req$query,query = _objectWithoutProperties(_req$query, ["sharedId"]);
    _relationships.default.search(req.query.sharedId, query, req.language, req.user).
    then(results => res.json(results)).
    catch(next);
  });


  app.get('/api/references/count_by_relationtype',
  _utils.validation.validateRequest(_joi.default.object().keys({
    relationtypeId: _joi.default.objectId().required() }).
  required(), 'query'),
  (req, res, next) => {
    _relationships.default.countByRelationType(req.query.relationtypeId).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;