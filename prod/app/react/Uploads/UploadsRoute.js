"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _reactHelmet = _interopRequireDefault(require("react-helmet"));
var _rison = _interopRequireDefault(require("rison"));

var _SearchAPI = _interopRequireDefault(require("../Search/SearchAPI"));
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _DocumentsList = _interopRequireDefault(require("../Library/components/DocumentsList"));
var _LibraryCharts = _interopRequireDefault(require("../Charts/components/LibraryCharts"));
var _LibraryFilters = _interopRequireDefault(require("../Library/components/LibraryFilters"));

var _libraryActions = require("../Library/actions/libraryActions");
var _libraryFilters = _interopRequireDefault(require("../Library/helpers/libraryFilters"));
var _SearchButton = _interopRequireDefault(require("../Library/components/SearchButton"));
var _ViewMetadataPanel = _interopRequireDefault(require("../Library/components/ViewMetadataPanel"));
var _SelectMultiplePanelContainer = _interopRequireDefault(require("../Library/containers/SelectMultiplePanelContainer"));
var _BasicReducer = require("../BasicReducer");
var _reactReduxForm = require("react-redux-form");
var _I18N = require("../I18N");
var _Multireducer = require("../Multireducer");

var _UploadBox = _interopRequireDefault(require("./components/UploadBox"));
var _UploadsHeader = _interopRequireDefault(require("./components/UploadsHeader"));
var _ImportPanel = _interopRequireDefault(require("./components/ImportPanel"));
var _prioritySortingCriteria = _interopRequireDefault(require("../utils/prioritySortingCriteria"));
var _socket = _interopRequireDefault(require("../socket"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


const setReduxState = (state) =>
_dispatch => {
  const dispatch = (0, _Multireducer.wrapDispatch)(_dispatch, 'uploads');
  dispatch((0, _libraryActions.setDocuments)(state.uploads.documents));
  dispatch(_BasicReducer.actions.set('aggregations', state.uploads.aggregations));
  dispatch(_reactReduxForm.actions.load('uploads.search', state.uploads.search));
  dispatch({ type: 'SET_LIBRARY_FILTERS',
    documentTypes: state.uploads.filters.documentTypes,
    libraryFilters: state.uploads.filters.properties });

};

class Uploads extends _RouteHandler.default {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
    this.refreshSearch = this.refreshSearch.bind(this);
  }

  static renderTools() {
    return (
      _jsx("div", { className: "searchBox" }, void 0,
      _jsx(_SearchButton.default, { storeKey: "uploads" })));


  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  static async requestState(requestParams, globalResources) {
    const defaultSearch = _prioritySortingCriteria.default.get({ templates: globalResources.templates });
    const query = _rison.default.decode(requestParams.data.q || '()');
    query.order = query.order || defaultSearch.order;
    query.sort = query.sort || defaultSearch.sort;
    query.unpublished = true;

    const documents = await _SearchAPI.default.search(requestParams.set(query));
    const filterState = _libraryFilters.default.URLQueryToState(
    query,
    globalResources.templates.toJS(),
    globalResources.thesauris.toJS(),
    globalResources.relationTypes.toJS());


    return [
    setReduxState({
      uploads: {
        documents,
        filters: { documentTypes: query.types || [], properties: filterState.properties },
        aggregations: documents.aggregations,
        search: filterState.search } })];



  }

  refreshSearch() {
    super.getClientState(this.props);
  }

  componentDidMount() {
    const dispatch = (0, _Multireducer.wrapDispatch)(this.context.store.dispatch, 'uploads');
    _socket.default.on('IMPORT_CSV_END', this.refreshSearch);
    dispatch((0, _libraryActions.enterLibrary)());
  }

  componentWillUnmount() {
    _socket.default.removeListener('IMPORT_CSV_END', this.refreshSearch);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.query.q !== this.props.location.query.q) {
      return this.superComponentWillReceiveProps(nextProps);
    }
  }

  render() {
    const query = _rison.default.decode(this.props.location.query.q || '()');
    const chartView = this.props.location.query.view === 'chart';
    const mainView = !chartView ? _jsx(_DocumentsList.default, { storeKey: "uploads" }) : _jsx(_LibraryCharts.default, { storeKey: "uploads" });

    return (
      _jsx("div", { className: "row panels-layout" }, void 0,
      _jsx(_reactHelmet.default, { title: (0, _I18N.t)('System', 'Uploads', null, false) }),
      _jsx(_UploadsHeader.default, {}),
      _jsx("main", { className: "uploads-viewer document-viewer with-panel" }, void 0,
      _jsx(_UploadBox.default, {}),

      mainView),

      _jsx(_LibraryFilters.default, { uploadsSection: true, storeKey: "uploads" }),
      _jsx(_ViewMetadataPanel.default, { storeKey: "uploads", searchTerm: query.searchTerm }),
      _jsx(_SelectMultiplePanelContainer.default, { storeKey: "uploads" }),
      _jsx(_ImportPanel.default, {})));


  }}exports.default = Uploads;