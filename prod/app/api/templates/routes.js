"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));

var _settings = _interopRequireDefault(require("../settings"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _templates = _interopRequireDefault(require("./templates"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.post('/api/templates',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string(),
    __v: _joi.default.number(),
    name: _joi.default.string().required(),
    color: _joi.default.string().allow(''),
    default: _joi.default.boolean(),
    properties: _joi.default.array().required().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      id: _joi.default.string(),
      localID: _joi.default.string(),
      label: _joi.default.string(),
      name: _joi.default.string(),
      nestedProperties: _joi.default.array(),
      type: _joi.default.string(),
      relationType: _joi.default.string(),
      filter: _joi.default.boolean(),
      noLabel: _joi.default.boolean(),
      defaultfilter: _joi.default.boolean(),
      required: _joi.default.boolean(),
      inherit: _joi.default.boolean(),
      inheritProperty: _joi.default.string().allow(null).allow(''),
      sortable: _joi.default.boolean(),
      showInCard: _joi.default.boolean(),
      fullWidth: _joi.default.boolean(),
      content: _joi.default.alternatives().when('type', {
        is: 'relationship',
        then: _joi.default.string().allow(['']),
        otherwise: _joi.default.string() }),

      prioritySorting: _joi.default.boolean(),
      style: _joi.default.string(),
      inserting: _joi.default.any() })),


    commonProperties: _joi.default.array().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      localID: _joi.default.string(),
      isCommonProperty: _joi.default.boolean(),
      label: _joi.default.string(),
      name: _joi.default.string(),
      prioritySorting: _joi.default.boolean(),
      type: _joi.default.string() })) }).


  required()),
  (req, res, next) => {
    _templates.default.save(req.body, req.language).
    then(response => {
      res.json(response);
      req.io.sockets.emit('templateChange', response);
      return response;
    }).
    then(response => _settings.default.updateFilterName(response._id.toString(), response.name)).
    then(updatedSettings => {
      if (updatedSettings) {
        req.io.sockets.emit('updateSettings', updatedSettings);
      }
    }).
    catch(next);
  });


  app.post('/api/templates/setasdefault',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string().required() })),

  (req, res, next) => {
    _templates.default.setAsDefault(req.body._id).
    then(([newDefault, oldDefault]) => {
      req.io.sockets.emit('templateChange', newDefault);
      if (oldDefault) {
        req.io.sockets.emit('templateChange', oldDefault);
      }
      res.json(newDefault);
    }).
    catch(next);
  });

  app.get('/api/templates', (req, res, next) => {
    _templates.default.get().
    then(response => res.json({ rows: response })).
    catch(next);
  });

  app.delete('/api/templates',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object({
    _id: _joi.default.string().required() }).
  required(), 'query'),
  (req, res, next) => {
    const template = { _id: req.query._id };
    _templates.default.delete(template).
    then(() => _settings.default.removeTemplateFromFilters(template._id)).
    then(newSettings => {
      res.json(template);
      req.io.sockets.emit('updateSettings', newSettings);
      req.io.sockets.emit('templateDelete', template);
    }).
    catch(next);
  });


  app.get('/api/templates/count_by_thesauri',

  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string().required() }).
  required(), 'query'),

  (req, res, next) => {
    _templates.default.countByThesauri(req.query._id).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;