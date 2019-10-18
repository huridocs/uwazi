"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _relationtypes = _interopRequireDefault(require("./relationtypes"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.post('/api/relationtypes',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId(),
    __v: _joi.default.number(),
    name: _joi.default.string(),
    properties: _joi.default.array().items(
    _joi.default.object().keys({
      _id: _joi.default.string(),
      __v: _joi.default.number(),
      localID: _joi.default.string(),
      id: _joi.default.string(),
      label: _joi.default.string(),
      type: _joi.default.string(),
      content: _joi.default.string(),
      name: _joi.default.string(),
      filter: _joi.default.boolean(),
      sortable: _joi.default.boolean(),
      showInCard: _joi.default.boolean(),
      prioritySorting: _joi.default.boolean(),
      nestedProperties: _joi.default.array() })) }).


  required()),
  (req, res, next) => {
    _relationtypes.default.save(req.body).
    then(response => res.json(response)).
    catch(next);
  });


  app.get('/api/relationtypes',
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId() }),
  'query'),
  (req, res, next) => {
    if (req.query._id) {
      return _relationtypes.default.getById(req.query._id).
      then(response => res.json({ rows: [response] })).
      catch(next);
    }

    _relationtypes.default.get().
    then(response => res.json({ rows: response })).
    catch(next);
  });


  app.delete('/api/relationtypes',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId().required() }).
  required(), 'query'),
  (req, res, next) => {
    _relationtypes.default.delete(req.query._id).
    then(response => res.json(response)).
    catch(next);
  });

};exports.default = _default;