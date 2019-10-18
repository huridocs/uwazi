"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _multer = _interopRequireDefault(require("multer"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _thesauris = _interopRequireDefault(require("./thesauris"));
var _storageConfig = _interopRequireDefault(require("../upload/storageConfig"));
var _csv = _interopRequireDefault(require("../csv"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const storage = _multer.default.diskStorage(_storageConfig.default);var _default =

app => {
  const upload = (0, _multer.default)({ storage });

  app.post('/api/thesauris',
  (0, _authMiddleware.default)(),

  upload.any(),

  _utils.validation.validateRequest(_joi.default.alternatives(
  _joi.default.object().keys({
    _id: _joi.default.string(),
    __v: _joi.default.number(),
    name: _joi.default.string().required(),
    values: _joi.default.array().items(
    _joi.default.object().keys({
      id: _joi.default.string(),
      label: _joi.default.string().required(),
      _id: _joi.default.string(),
      values: _joi.default.array() })).
    required() }).
  required(),
  _joi.default.object().keys({
    thesauri: _joi.default.string().required() }).
  required()).
  required()),

  async (req, res, next) => {
    try {
      const data = req.files && req.files.length ? JSON.parse(req.body.thesauri) : req.body;
      let response = await _thesauris.default.save(data);
      if (req.files && req.files.length) {
        const file = req.files[0];
        const loader = new _csv.default();
        response = await loader.loadThesauri(file.path, response._id, { language: req.language });
      }
      res.json(response);
      req.io.sockets.emit('thesauriChange', response);
    } catch (e) {
      next(e);
    }
  });


  app.get('/api/thesauris',
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string() }),
  'query'),
  (req, res, next) => {
    let id;
    if (req.query) {
      id = req.query._id;
    }
    _thesauris.default.get(id, req.language, req.user).
    then(response => res.json({ rows: response })).
    catch(next);
  });


  app.get('/api/dictionaries',
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string() }),
  'query'),
  (req, res, next) => {
    let id;
    if (req.query && req.query._id) {
      id = { _id: req.query._id };
    }
    _thesauris.default.dictionaries(id).
    then(response => res.json({ rows: response })).
    catch(next);
  });


  app.delete('/api/thesauris',
  (0, _authMiddleware.default)(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string().required(),
    _rev: _joi.default.any() }).
  required(), 'query'),
  (req, res, next) => {
    _thesauris.default.delete(req.query._id, req.query._rev).
    then(response => {
      res.json(response);
      req.io.sockets.emit('thesauriDelete', response);
    }).
    catch(next);
  });

};exports.default = _default;