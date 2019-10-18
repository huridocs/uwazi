"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _multer = _interopRequireDefault(require("multer"));

var _odm = require("../odm");
var _entities = _interopRequireDefault(require("../entities"));
var _path = _interopRequireDefault(require("path"));
var _search = _interopRequireDefault(require("../search/search"));

var _auth = require("../auth");
var _paths = _interopRequireDefault(require("../config/paths"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const storage = _multer.default.diskStorage({
  destination(req, file, cb) {
    cb(null, _path.default.normalize(`${_paths.default.uploadedDocuments}/`));
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  } });var _default =



app => {
  const upload = (0, _multer.default)({ storage });

  app.post(
  '/api/sync',
  (0, _auth.needsAuthorization)(['admin']),
  async (req, res, next) => {
    try {
      if (req.body.namespace === 'settings') {
        const [settings] = await _odm.models.settings.get({});
        req.body.data._id = settings._id;
      }

      await _odm.models[req.body.namespace].save(req.body.data);

      if (req.body.namespace === 'entities') {
        await _entities.default.indexEntities({ _id: req.body.data._id }, '+fullText');
      }
      res.json('ok');
    } catch (e) {
      next(e);
    }
  });


  app.post(
  '/api/sync/upload',
  (0, _auth.needsAuthorization)(['admin']),
  upload.any(),
  (req, res) => {
    res.json('ok');
  });


  app.delete(
  '/api/sync',
  (0, _auth.needsAuthorization)(['admin']),
  async (req, res, next) => {
    try {
      await _odm.models[req.query.namespace].delete(JSON.parse(req.query.data));
      if (req.query.namespace === 'entities') {
        try {
          await _search.default.delete({ _id: JSON.parse(req.query.data)._id });
        } catch (err) {
          if (err.statusCode !== 404) {throw err;}
        }
      }
      res.json('ok');
    } catch (e) {
      next(e);
    }
  });

};exports.default = _default;