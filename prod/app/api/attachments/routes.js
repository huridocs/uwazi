"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _Error = _interopRequireDefault(require("../utils/Error"));
var _multer = _interopRequireDefault(require("multer"));
var _sanitizeFilename = _interopRequireDefault(require("sanitize-filename"));

var _uniqueID = _interopRequireDefault(require("../../shared/uniqueID"));
var _entities = _interopRequireDefault(require("../entities"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));

var _paths = _interopRequireDefault(require("../config/paths"));
var _attachments = _interopRequireDefault(require("./attachments"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const storage = _multer.default.diskStorage({
  destination(req, file, cb) {
    cb(null, _paths.default.attachments);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + (0, _uniqueID.default)() + _path.default.extname(file.originalname));
  } });


const assignAttachment = (entity, addedFile) => {
  const conformedEntity = { _id: entity._id, attachments: entity.attachments || [] };
  conformedEntity.attachments.push(addedFile);
  return conformedEntity;
};

const processSingleLanguage = (entity, req) => {
  const addedFile = req.files[0];
  addedFile._id = _mongoose.default.Types.ObjectId();
  addedFile.timestamp = Date.now();
  return Promise.all([addedFile, _entities.default.saveMultiple([assignAttachment(entity, addedFile)])]);
};

const processAllLanguages = (entity, req) => processSingleLanguage(entity, req).
then(([addedFile]) => Promise.all([addedFile, _entities.default.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } })])).
then(([addedFile, siblings]) => {
  const genericAddedFile = Object.assign({}, addedFile);
  delete genericAddedFile._id;

  const additionalLanguageUpdates = [];

  siblings.forEach(sibling => {
    additionalLanguageUpdates.push(_entities.default.saveMultiple([assignAttachment(sibling, genericAddedFile)]));
  });

  return Promise.all([addedFile].concat(additionalLanguageUpdates));
});var _default =

app => {
  const upload = (0, _multer.default)({ storage });

  app.get(
  '/api/attachment/:file',
  (req, res) => {
    const filePath = `${_path.default.resolve(_paths.default.attachments)}/${_path.default.basename(req.params.file)}`;
    _fs.default.stat(filePath, err => {
      if (err) {
        return res.redirect('/public/no-preview.png');
      }
      return res.sendFile(filePath);
    });
  });

  app.get('/api/attachments/download',

  _utils.validation.validateRequest(_joi.default.object({
    _id: _joi.default.objectId().required(),
    file: _joi.default.string().required() }).
  required(), 'query'),

  (req, res, next) => {
    _entities.default.getById(req.query._id).
    then(response => {
      if (!response) {
        throw (0, _Error.default)('entitiy does not exist', 404);
      }
      const file = response.attachments.find(a => a.filename === req.query.file);
      if (!file) {
        throw (0, _Error.default)('file not found', 404);
      }
      const newName = _path.default.basename(file.originalname, _path.default.extname(file.originalname)) + _path.default.extname(file.filename);
      res.download(_path.default.join(_paths.default.attachments, file.filename), (0, _sanitizeFilename.default)(newName));
    }).
    catch(next);
  });

  app.post(
  '/api/attachments/upload',
  (0, _authMiddleware.default)(['admin', 'editor']),
  upload.any(),
  _utils.validation.validateRequest(_joi.default.object().keys({
    entityId: _joi.default.string().required(),
    allLanguages: _joi.default.boolean() }).
  required()),
  (req, res, next) => _entities.default.getById(req.body.entityId).
  then(entity => req.body.allLanguages === 'true' ? processAllLanguages(entity, req) :
  processSingleLanguage(entity, req)).
  then(([addedFile]) => {
    res.json(addedFile);
  }).
  catch(next));


  app.post(
  '/api/attachments/rename',

  (0, _authMiddleware.default)(['admin', 'editor']),

  _utils.validation.validateRequest(_joi.default.object({
    _id: _joi.default.objectId().required(),
    entityId: _joi.default.string().required(),
    originalname: _joi.default.string().required(),
    language: _joi.default.string() }).
  required()),

  (req, res, next) => {
    let renamedAttachment;
    return _entities.default.getById(req.body.entityId).
    then(entity => {
      let entityWithRenamedAttachment;
      if (entity._id.toString() === req.body._id) {
        entityWithRenamedAttachment = _objectSpread({}, entity, { file: _objectSpread({}, entity.file, { originalname: req.body.originalname, language: req.body.language }) });
        renamedAttachment = Object.assign({ _id: entity._id.toString() }, entityWithRenamedAttachment.file);
      } else {
        entityWithRenamedAttachment = _objectSpread({},
        entity, {
          attachments: (entity.attachments || []).map(attachment => {
            if (attachment._id.toString() === req.body._id) {
              renamedAttachment = _objectSpread({}, attachment, { originalname: req.body.originalname });
              return renamedAttachment;
            }

            return attachment;
          }) });

      }


      return _entities.default.saveMultiple([entityWithRenamedAttachment]);
    }).
    then(() => {
      res.json(renamedAttachment);
    }).
    catch(next);
  });

  app.delete(
  '/api/attachments/delete',

  (0, _authMiddleware.default)(['admin', 'editor']),

  _utils.validation.validateRequest(_joi.default.object({
    attachmentId: _joi.default.string().required() }).
  required(), 'query'),

  async (req, res, next) => {
    try {
      const response = await _attachments.default.delete(req.query.attachmentId);
      res.json(response);
    } catch (e) {
      next(e);
    }
  });

};exports.default = _default;