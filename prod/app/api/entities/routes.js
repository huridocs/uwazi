"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _joiObjectid = _interopRequireDefault(require("joi-objectid"));
var _entities2 = _interopRequireDefault(require("./entities"));
var _templates = _interopRequireDefault(require("../templates/templates"));
var _thesauris = _interopRequireDefault(require("../thesauris/thesauris"));
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _utils = require("../utils");
var _endpointSchema = require("./endpointSchema");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

_joi.default.objectId = (0, _joiObjectid.default)(_joi.default);var _default =

app => {
  app.post(
  '/api/entities',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_endpointSchema.saveSchema),
  (req, res, next) => _entities2.default.save(req.body, { user: req.user, language: req.language }).
  then(response => {
    res.json(response);
    return _templates.default.getById(response.template);
  }).
  then(template => _thesauris.default.templateToThesauri(template, req.language, req.user)).
  then(templateTransformed => {
    req.io.sockets.emit('thesauriChange', templateTransformed);
  }).
  catch(next));


  app.post(
  '/api/entities/multipleupdate',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object().keys({
    ids: _joi.default.array().items(_joi.default.string()).required(),
    values: _joi.default.object().keys({
      metadata: _endpointSchema.metadataSchema,
      template: _joi.default.string(),
      published: _joi.default.boolean(),
      icon: _endpointSchema.iconSchema }).
    required() }).
  required()),
  (req, res, next) => _entities2.default.multipleUpdate(req.body.ids, req.body.values, { user: req.user, language: req.language }).
  then(docs => {
    res.json(docs.map(doc => doc.sharedId));
  }).
  catch(next));

  app.get(
  '/api/entities/count_by_template',
  _utils.validation.validateRequest(_joi.default.object().keys({
    templateId: _joi.default.objectId().required() }).
  required(), 'query'),
  (req, res, next) => _entities2.default.countByTemplate(req.query.templateId).
  then(response => res.json(response)).
  catch(next));


  app.get(
  '/api/entities/get_raw_page',
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string().required(),
    pageNumber: _joi.default.number().required() }).
  required(), 'query'),
  (req, res, next) => _entities2.default.getRawPage(req.query.sharedId, req.language, req.query.pageNumber).
  then(data => res.json({ data })).
  catch(next));


  app.get('/api/entities',
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string().required(),
    omitRelationships: _joi.default.any() }).
  required(), 'query'),
  (req, res, next) => {
    const action = req.query.omitRelationships ? 'get' : 'getWithRelationships';
    _entities2.default[action]({ sharedId: req.query.sharedId, language: req.language }).
    then(_entities => {
      if (!_entities.length || !_entities[0].published && !req.user) {
        res.status(404);
        res.json({});
        return;
      }
      if (!req.user && _entities[0].relationships) {
        const entity = _entities[0];
        entity.relationships = entity.relationships.filter(rel => rel.entityData.published);
      }
      res.json({ rows: _entities });
    }).
    catch(next);
  });

  app.delete('/api/entities',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedId: _joi.default.string().required() }).
  required(), 'query'),
  (req, res, next) => {
    _entities2.default.delete(req.query.sharedId).
    then(response => res.json(response)).
    catch(next);
  });

  app.post('/api/entities/bulkdelete',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object().keys({
    sharedIds: _joi.default.array().items(_joi.default.string()).required() }).
  required(), 'body'),
  (req, res, next) => {
    _entities2.default.deleteMultiple(req.body.sharedIds).
    then(() => res.json('ok')).
    catch(next);
  });
};exports.default = _default;