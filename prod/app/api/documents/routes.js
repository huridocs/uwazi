"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _sanitizeFilename = _interopRequireDefault(require("sanitize-filename"));

var _utils = require("../utils");
var _path = _interopRequireDefault(require("path"));

var _paths = _interopRequireDefault(require("../config/paths"));

var _documents = _interopRequireDefault(require("./documents"));
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _templates = _interopRequireDefault(require("../templates"));

var _entities = require("../entities");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var _default =

app => {
  app.post('/api/documents',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_entities.endpointSchema.saveSchema),
  (req, res, next) => _documents.default.
  save(req.body, { user: req.user, language: req.language }).
  then(doc => res.json(doc)).
  catch(next));

  app.post(
  '/api/documents/pdfInfo',
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.objectId(),
    sharedId: _joi.default.string(),
    pdfInfo: _joi.default.object().pattern(_joi.default.number(), _joi.default.object().keys({
      chars: _joi.default.number() })) }).

  required()),
  (req, res, next) => _documents.default.savePDFInfo(req.body, { language: req.language }).
  then(doc => res.json(doc)).
  catch(next));

  app.get(
  '/api/documents/count_by_template',
  _utils.validation.validateRequest(_joi.default.object().keys({
    templateId: _joi.default.objectId().required() }).
  required(), 'query'),
  (req, res, next) => _templates.default.countByTemplate(req.query.templateId).
  then(results => res.json(results)).
  catch(next));

  app.get(
  '/api/documents',
  _utils.validation.validateRequest(_joi.default.object().keys({
    _id: _joi.default.string().required() }),
  'query'),
  (req, res, next) => {
    let id;

    if (req.query && req.query._id) {
      id = req.query._id;
    }

    _documents.default.getById(id, req.language).then(response => {
      if (!response) {
        res.json({}, 404);
        return;
      }
      res.json({ rows: [response] });
    }).
    catch(next);
  });

  app.delete(
  '/api/documents',
  (0, _authMiddleware.default)(['admin', 'editor']),
  _utils.validation.validateRequest(_joi.default.object({
    sharedId: _joi.default.string().required() }).
  required(), 'query'),

  (req, res, next) => {
    _documents.default.delete(req.query.sharedId).
    then(response => res.json(response)).
    catch(next);
  });


  app.get(
  '/api/documents/download',

  _utils.validation.validateRequest(_joi.default.object({
    _id: _joi.default.objectId().required() }).
  required(), 'query'),

  (req, res, next) => {
    _documents.default.getById(req.query._id).
    then(response => {
      if (!response) {
        throw (0, _utils.createError)('document does not exist', 404);
      }
      const basename = _path.default.basename(response.file.originalname, _path.default.extname(response.file.originalname));
      res.download(_path.default.join(_paths.default.uploadedDocuments, response.file.filename), (0, _sanitizeFilename.default)(basename + _path.default.extname(response.file.filename)));
    }).
    catch(next);
  });

};exports.default = _default;