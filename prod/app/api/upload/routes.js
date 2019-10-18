"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _joi = _interopRequireDefault(require("joi"));
var _multer = _interopRequireDefault(require("multer"));

var _debugLog = _interopRequireDefault(require("../log/debugLog"));
var _entities = _interopRequireDefault(require("../entities"));
var _errorLog = _interopRequireDefault(require("../log/errorLog"));
var _relationships = _interopRequireDefault(require("../relationships"));

var _csv = _interopRequireDefault(require("../csv"));
var _endpointSchema = require("../entities/endpointSchema");
var _files = require("../utils/files");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _expressHttpProxy = _interopRequireDefault(require("express-http-proxy"));
var _settings = _interopRequireDefault(require("../settings"));
var _paths = _interopRequireDefault(require("../config/paths"));
var _utils = require("../utils");
var _authMiddleware = _interopRequireDefault(require("../auth/authMiddleware"));
var _captchaMiddleware = _interopRequireDefault(require("../auth/captchaMiddleware"));
var _uploads = _interopRequireDefault(require("./uploads"));
var _storageConfig = _interopRequireDefault(require("./storageConfig"));
var _uploadProcess = _interopRequireDefault(require("./uploadProcess"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const storage = _multer.default.diskStorage(_storageConfig.default);

const getDocuments = (sharedId, allLanguages, language) =>
_entities.default.get(_objectSpread({
  sharedId },
!allLanguages && { language }));


const storeFile = file => new Promise((resolve, reject) => {
  const filename = (0, _files.generateFileName)(file);
  const destination = _paths.default.uploadedDocuments;
  const pathToFile = _path.default.join(destination, filename);
  _fs.default.appendFile(pathToFile, file.buffer, err => {
    if (err) {
      reject(err);
    }
    resolve(Object.assign(file, { filename, destination }));
  });
});

/*eslint-disable max-statements*/var _default =
app => {
  const upload = (0, _multer.default)({ storage });

  const socket = req => req.getCurrentSessionSockets();

  const uploadProcess = async (req, res, allLanguages = true) => {
    try {
      const docs = await getDocuments(req.body.document, allLanguages, req.language);
      await (0, _uploadProcess.default)(docs, req.files[0]).
      on('conversionStart', () => {
        res.json(req.files[0]);
        socket(req).emit('conversionStart', req.body.document);
      }).
      start();

      await _entities.default.indexEntities({ sharedId: req.body.document }, '+fullText');
      socket(req).emit('documentProcessed', req.body.document);
    } catch (err) {
      _errorLog.default.error(err);
      _debugLog.default.debug(err);
      socket(req).emit('conversionFailed', req.body.document);
    }
  };

  app.post(
  '/api/upload',

  (0, _authMiddleware.default)(['admin', 'editor']),

  upload.any(),

  _utils.validation.validateRequest(_joi.default.object({
    document: _joi.default.string().required() }).
  required()),

  (req, res) => uploadProcess(req, res));


  app.post(
  '/api/public',
  (0, _multer.default)().any(),
  (0, _captchaMiddleware.default)(),
  (req, res, next) => {req.body = JSON.parse(req.body.entity);return next();},
  _utils.validation.validateRequest(_endpointSchema.saveSchema),
  async (req, res, next) => {
    const entity = req.body;
    const { allowedPublicTemplates } = await _settings.default.get(true);
    if (!allowedPublicTemplates || !allowedPublicTemplates.includes(entity.template)) {
      next((0, _utils.createError)('Unauthorized public template', 403));
      return;
    }

    entity.attachments = [];
    if (req.files.length) {
      await Promise.all(
      req.files.
      filter(file => file.fieldname.includes('attachment')).
      map(file => storeFile(file).then(_file => entity.attachments.push(_file))));

    }
    const newEntity = await _entities.default.save(entity, { user: {}, language: req.language });
    const file = req.files.find(_file => _file.fieldname.includes('file'));
    if (file) {
      storeFile(file).then(async _file => {
        const newEntities = await _entities.default.getAllLanguages(newEntity.sharedId);
        await (0, _uploadProcess.default)(newEntities, _file).start();
        await _entities.default.indexEntities({ sharedId: newEntity.sharedId }, '+fullText');
        socket(req).emit('documentProcessed', newEntity.sharedId);
      });
    }
    res.json(newEntity);
  });


  app.post(
  '/api/remotepublic',
  async (req, res, next) => {
    const { publicFormDestination } = await _settings.default.get(true);
    (0, _expressHttpProxy.default)(publicFormDestination, {
      limit: '20mb',
      proxyReqPathResolver() {
        return '/api/public';
      },
      proxyReqOptDecorator(proxyReqOpts, srcReq) {
        const options = Object.assign({}, proxyReqOpts);
        options.headers.Cookie = srcReq.session.remotecookie;
        return options;
      } })(
    req, res, next);
  });



  app.post(
  '/api/import',

  (0, _authMiddleware.default)(['admin']),

  upload.any(),

  _utils.validation.validateRequest(_joi.default.object({
    template: _joi.default.string().required() }).
  required()),

  (req, res) => {
    const loader = new _csv.default();
    let loaded = 0;

    loader.on('entityLoaded', () => {
      loaded += 1;
      req.getCurrentSessionSockets().emit('IMPORT_CSV_PROGRESS', loaded);
    });

    loader.on('loadError', error => {
      req.getCurrentSessionSockets().emit('IMPORT_CSV_ERROR', (0, _utils.handleError)(error));
    });

    req.getCurrentSessionSockets().emit('IMPORT_CSV_START');
    loader.load(req.files[0].path, req.body.template, { language: req.language, user: req.user }).
    then(() => {
      req.getCurrentSessionSockets().emit('IMPORT_CSV_END');
    }).
    catch(e => {
      req.getCurrentSessionSockets().emit('IMPORT_CSV_ERROR', (0, _utils.handleError)(e));
    });

    res.json('ok');
  });


  app.post('/api/customisation/upload', (0, _authMiddleware.default)(['admin', 'editor']), upload.any(), (req, res, next) => {
    _uploads.default.save(req.files[0]).
    then(saved => {
      res.json(saved);
    }).
    catch(next);
  });

  app.get('/api/customisation/upload', (0, _authMiddleware.default)(['admin', 'editor']), (req, res, next) => {
    _uploads.default.get().
    then(result => {
      res.json(result);
    }).
    catch(next);
  });

  app.delete(
  '/api/customisation/upload',

  (0, _authMiddleware.default)(['admin', 'editor']),

  _utils.validation.validateRequest(_joi.default.object({
    _id: _joi.default.string().required() }).
  required(), 'query'),

  (req, res, next) => {
    _uploads.default.delete(req.query._id).
    then(result => {
      res.json(result);
    }).
    catch(next);
  });


  app.post(
  '/api/reupload',

  (0, _authMiddleware.default)(['admin', 'editor']),

  upload.any(),

  _utils.validation.validateRequest(_joi.default.object({
    document: _joi.default.string().required() }).
  required()),

  (req, res, next) => _entities.default.getById(req.body.document, req.language).
  then(doc => {
    let deleteReferences = Promise.resolve();
    if (doc.file) {
      deleteReferences = _relationships.default.deleteTextReferences(doc.sharedId, doc.language);
    }
    return Promise.all([doc, deleteReferences]);
  }).
  then(([doc]) => _entities.default.saveMultiple([{ _id: doc._id, toc: [] }])).
  then(([{ sharedId }]) => _entities.default.get({ sharedId })).
  then(docs => docs.reduce((addToAllLanguages, doc) => addToAllLanguages && !doc.file, true)).
  then(addToAllLanguages => uploadProcess(req, res, addToAllLanguages)).
  catch(next));

};exports.default = _default;