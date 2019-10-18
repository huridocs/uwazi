"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = require("react");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _moment = _interopRequireDefault(require("moment"));

var _I18N = require("../I18N");
var _JSONUtils = _interopRequireDefault(require("../../shared/JSONUtils"));
var _api = _interopRequireDefault(require("../utils/api"));
var _RequestParams = require("../utils/RequestParams");
var _utils = require("../utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

const getLocale = ({ store }) => store.getState().locale;

const setLocale = locale => {
  _moment.default.locale(locale);
  _api.default.locale(locale);
  _I18N.I18NUtils.saveLocale(locale);
};

class RouteHandler extends _react.Component {
  static requestState() {
    return Promise.resolve([]);
  }

  emptyState() {} //eslint-disable-line

  static renderTools() {}

  isRenderedFromServer() {//eslint-disable-line
    const result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  constructor(props, context) {
    super(props, context);
    setLocale(getLocale(context));
    if (!this.isRenderedFromServer() && _utils.isClient) {
      this.getClientState(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.urlHasChanged(nextProps)) {
      this.emptyState();
      this.getClientState(nextProps);
    }
  }

  async getClientState(props) {
    let query;
    if (props.location) {
      query = _JSONUtils.default.parseNested(props.location.query);
    }

    const { store = { getState: () => {} } } = this.context;

    const headers = {};
    const _props$params = props.params,{ lang } = _props$params,params = _objectWithoutProperties(_props$params, ["lang"]);
    const requestParams = new _RequestParams.RequestParams(_objectSpread({}, query, {}, params), headers);
    const actions = await this.constructor.requestState(requestParams, store.getState());

    actions.forEach(action => {
      store.dispatch(action);
    });
  }

  urlHasChanged(nextProps) {
    const { params: nextParams = {}, routes: nextRoutes = [] } = nextProps;
    const { params, routes } = this.props;

    const sameParams = Object.keys(nextParams).reduce((memo, key) => memo && nextProps.params[key] === params[key], true);
    const sameAmountOfparams = Object.keys(nextParams).length === Object.keys(params).length;
    const currentPath = routes.reduce((path, r) => path + r.path, '');
    const newPath = nextRoutes.reduce((path, r) => path + r.path, '');
    const samePath = currentPath === newPath;
    return !sameParams || !sameAmountOfparams || !samePath;
  }

  render() {
    return false;
  }}


RouteHandler.renderedFromServer = true;

RouteHandler.defaultProps = {
  params: {} };


RouteHandler.contextTypes = {
  getInitialData: _propTypes.default.func,
  isRenderedFromServer: _propTypes.default.func,
  router: _propTypes.default.object,
  store: _propTypes.default.object };var _default =








RouteHandler;exports.default = _default;