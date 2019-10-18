"use strict";
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _compression = _interopRequireDefault(require("compression"));
var _express = _interopRequireDefault(require("express"));
var _helmet = _interopRequireDefault(require("helmet"));
var _mongoose = _interopRequireDefault(require("mongoose"));

var _http = require("http");
var _path = _interopRequireDefault(require("path"));

var _paths = _interopRequireDefault(require("./api/config/paths"));
var _api = _interopRequireDefault(require("./api/api"));
var _routes = _interopRequireDefault(require("./api/auth/routes"));
var _database = _interopRequireDefault(require("./api/config/database"));
var _migrator = _interopRequireDefault(require("./api/migrations/migrator"));
var _error_handling_middleware = _interopRequireDefault(require("./api/utils/error_handling_middleware"));
var _handleError = _interopRequireDefault(require("./api/utils/handleError.js"));
var _ports = _interopRequireDefault(require("./api/config/ports.js"));
var _privateInstanceMiddleware = _interopRequireDefault(require("./api/auth/privateInstanceMiddleware"));
var _server = _interopRequireDefault(require("./react/server.js"));
var _systemKeys = _interopRequireDefault(require("./api/i18n/systemKeys.js"));
var _translations = _interopRequireDefault(require("./api/i18n/translations.js"));
var _message = _interopRequireDefault(require("../message"));
var _semanticsearch = require("./api/semanticsearch");
var _syncWorker = _interopRequireDefault(require("./api/sync/syncWorker"));
var _Repeater = _interopRequireDefault(require("./api/utils/Repeater"));
var _evidences_vault = _interopRequireDefault(require("./api/evidences_vault"));
var _settings = _interopRequireDefault(require("./api/settings"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

_mongoose.default.Promise = Promise;

const app = (0, _express.default)();
app.use((0, _helmet.default)());

const http = (0, _http.Server)(app);

const uncaughtError = error => {
  (0, _handleError.default)(error, { uncaught: true });
  process.exit(1);
};

process.on('unhandledRejection', uncaughtError);
process.on('uncaughtException', uncaughtError);
http.on('error', _handleError.default);

const oneYear = 31557600;

let maxage = 0;
if (app.get('env') === 'production') {
  maxage = oneYear;
}

app.use((0, _compression.default)());
app.use(_express.default.static(_path.default.resolve(__dirname, '../dist'), { maxage }));
app.use('/public', _express.default.static(_path.default.resolve(__dirname, '../public')));

app.use(/\/((?!remotepublic).)*/, _bodyParser.default.json({ limit: '1mb' }));

(0, _routes.default)(app);

app.use(_privateInstanceMiddleware.default);
app.use('/flag-images', _express.default.static(_path.default.resolve(__dirname, '../dist/flags')));
app.use('/assets', _express.default.static(_paths.default.customUploads));
// retained for backwards compatibility
app.use('/uploaded_documents', _express.default.static(_paths.default.customUploads));


(0, _api.default)(app, http);

(0, _server.default)(app);

app.use(_error_handling_middleware.default);

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS };

}

_mongoose.default.connect(_database.default[app.get('env')], _objectSpread({}, dbAuth)).
then(async () => {
  console.info('==> Processing system keys...');
  await _translations.default.processSystemKeys(_systemKeys.default);

  const shouldMigrate = await _migrator.default.shouldMigrate();
  if (shouldMigrate) {
    console.info('\x1b[33m%s\x1b[0m', '==> Your database needs to be migrated, please wait.');
    await _migrator.default.migrate();
  }

  const port = _ports.default[app.get('env')];

  const bindAddress = { true: 'localhost' }[process.env.LOCALHOST_ONLY];

  _semanticsearch.workerManager.start();

  http.listen(port, bindAddress, async () => {
    _syncWorker.default.start();

    const { evidencesVault } = await _settings.default.get();
    if (evidencesVault && evidencesVault.token && evidencesVault.template) {
      console.info('==> 📥 evidences vault config detected, started sync ....');
      _Repeater.default.start(
      () => _evidences_vault.default.sync(evidencesVault.token, evidencesVault.template),
      10000);

    }

    console.info('==> 🌎 Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
    if (process.env.HOT) {
      console.info('');
      console.info('==> 📦 webpack is watching...');
      console.info(_message.default);
    }
  });
});