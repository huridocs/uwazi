"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _reactHelmet = require("react-helmet");
var _reactRouter = require("react-router");
var _reactReduxForm = require("react-redux-form");
var _react = _interopRequireDefault(require("react"));

var _RequestParams = require("../utils/RequestParams");
var _BasicReducer = require("../BasicReducer");
var _utils = require("../utils");
var _JSONRequest = require("../../shared/JSONRequest");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _Viewer = _interopRequireDefault(require("./components/Viewer"));
var _EntitiesAPI = _interopRequireDefault(require("../Entities/EntitiesAPI"));
var relationships = _interopRequireWildcard(require("../Relationships/utils/routeUtils"));

var _referencesActions = require("./actions/referencesActions");
var _uiActions = require("./actions/uiActions");
var _routeActions = require("./actions/routeActions");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}

class ViewDocument extends _RouteHandler.default {
  constructor(props, context) {
    super(props, context);
    this.changeBrowserHistoryPage = this.changeBrowserHistoryPage.bind(this);
    this.changePage = this.changePage.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
  }

  static async requestState(requestParams, globalResources) {
    return (0, _routeActions.requestViewerState)(
    requestParams.add({ raw: requestParams.data.raw === 'true' || !_utils.isClient }),
    globalResources);

  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    if (this.props.location.query.searchTerm) {
      this.context.store.dispatch(_BasicReducer.actions.set('viewer.sidepanel.tab', 'text-search'));
    }
  }

  componentWillReceiveProps(props) {
    super.componentWillReceiveProps(props);
    const { query = {} } = props.location;
    if (query.page !== this.props.location.query.page && query.raw !== 'true') {
      this.changePage(query.page);
    }
    if ((query.page !== this.props.location.query.page || query.raw !== this.props.location.query.raw) && query.raw === 'true') {
      const { sharedId } = props.params;
      return _EntitiesAPI.default.getRawPage(new _RequestParams.RequestParams({ sharedId, pageNumber: query.page })).
      then(pageText => {
        this.context.store.dispatch(_BasicReducer.actions.set('viewer/rawText', pageText));
      });
    }
  }

  emptyState() {
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/doc'));
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/templates'));
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/thesauris'));
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/relationTypes'));
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/rawText'));
    this.context.store.dispatch(_reactReduxForm.actions.reset('documentViewer.tocForm'));
    this.context.store.dispatch(_BasicReducer.actions.unset('viewer/targetDoc'));
    this.context.store.dispatch((0, _referencesActions.setReferences)([]));
    this.context.store.dispatch(relationships.emptyState());
  }

  changePage(nextPage) {
    if (!this.props.location.query.raw) {
      return (0, _uiActions.scrollToPage)(nextPage);
    }

    return this.changeBrowserHistoryPage(nextPage);
  }

  changeBrowserHistoryPage(newPage) {
    const { query: { page } } = this.props.location,queryWithoutPage = _objectWithoutProperties(this.props.location.query, ["page"]);
    queryWithoutPage.raw = queryWithoutPage.raw || undefined;
    _reactRouter.browserHistory.push(`${this.props.location.pathname}${(0, _JSONRequest.toUrlParams)(_objectSpread({}, queryWithoutPage, { page: newPage }))}`);
  }

  onDocumentReady(doc) {
    _utils.events.emit('documentLoaded');
    if (this.props.location.query.raw === 'true') {
      return;
    }
    if (this.props.location.query.page) {
      (0, _uiActions.scrollToPage)(this.props.location.query.page, 0);
    }
    const { ref } = this.props.location.query;
    if (ref) {
      const reference = doc.get('relationships').find(r => r.get('_id') === ref);
      this.context.store.dispatch((0, _uiActions.activateReference)(reference.toJS(), doc.get('pdfInfo').toJS()));
    }
  }

  render() {
    const { query = {}, pathname } = this.props.location;
    const raw = query.raw === 'true' || !_utils.isClient;
    const page = Number(query.page || 1);
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx(_reactHelmet.Helmet, {}, void 0,
      raw && _jsx("link", { rel: "canonical", href: `${pathname}?page=${page}` })),

      _jsx(_Viewer.default, {
        raw: raw,
        searchTerm: query.searchTerm,
        onPageChange: this.changeBrowserHistoryPage,
        onDocumentReady: this.onDocumentReady,
        changePage: this.changePage,
        page: page })));



  }}


ViewDocument.defaultProps = {
  params: {} };var _default =


ViewDocument;exports.default = _default;