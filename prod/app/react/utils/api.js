"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactRouter = require("react-router");

var _ = require("./");
var _notificationsActions = require("../Notifications/actions/notificationsActions");
var _store = require("../store");
var _LoadingProgressBar = _interopRequireDefault(require("../App/LoadingProgressBar"));

var _config = require("../config.js");
var _JSONRequest = _interopRequireDefault(require("../../shared/JSONRequest"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

let API_URL = _config.APIURL;
let language;

const doneLoading = data => {
  _LoadingProgressBar.default.done();
  return data;
};

const handleError = (e, endpoint) => {
  const error = e;
  error.endpoint = endpoint;

  if (!_.isClient) {
    return Promise.reject(error);
  }

  doneLoading();

  if (error.status === 401) {
    _reactRouter.browserHistory.replace('/login');
  }

  if (error.status === 404) {
    _reactRouter.browserHistory.replace('/404');
  }

  if (error.status === 500) {
    _store.store.dispatch((0, _notificationsActions.notify)('An error has occurred', 'danger'));
  }

  if (![500, 404, 401].includes(error.status)) {
    _store.store.dispatch((0, _notificationsActions.notify)(error.json.error, 'danger'));
  }

  return Promise.reject(error);
};

const _request = (url, req, method) => {
  _LoadingProgressBar.default.start();
  return _JSONRequest.default[method](API_URL + url, req.data, _objectSpread({
    'Content-Language': language },
  req.headers, {
    'X-Requested-With': 'XMLHttpRequest' })).

  then(doneLoading).
  catch(e => handleError(e, { url, method }));
};var _default =

{
  get: (url, req = {}) => _request(url, req, 'get'),

  post: (url, req = {}) => _request(url, req, 'post'),

  delete: (url, req = {}) => _request(url, req, 'delete'),

  cookie(c) {
    _JSONRequest.default.cookie(c);
  },

  locale(locale) {
    language = locale;
  },

  APIURL(url) {
    API_URL = url;
  } };exports.default = _default;