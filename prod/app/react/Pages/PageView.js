"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _rison = _interopRequireDefault(require("rison"));

var _BasicReducer = require("../BasicReducer");
var _Markdown = require("../Markdown");
var _libraryActions = require("../Library/actions/libraryActions");
var _Multireducer = require("../Multireducer");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _ViewMetadataPanel = _interopRequireDefault(require("../Library/components/ViewMetadataPanel"));
var _SelectMultiplePanelContainer = _interopRequireDefault(require("../Library/containers/SelectMultiplePanelContainer"));
var _SearchAPI = _interopRequireDefault(require("../Search/SearchAPI"));

var _PageViewer = _interopRequireDefault(require("./components/PageViewer"));
var _PagesAPI = _interopRequireDefault(require("./PagesAPI"));
var _pageItemLists = _interopRequireDefault(require("./utils/pageItemLists"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}

function prepareLists(content, requestParams) {
  const listsData = _pageItemLists.default.generate(content);

  listsData.searchs = Promise.all(listsData.params.map((params, index) => {
    const sanitizedParams = params ? decodeURI(params) : '';
    const queryDefault = { filters: {}, types: [] };
    let query = queryDefault;

    if (sanitizedParams) {
      query = _rison.default.decode(sanitizedParams.replace('?q=', '') || '()');
      if (_typeof(query) !== 'object') {
        query = queryDefault;
      }
    }

    query.limit = listsData.options[index].limit ? String(listsData.options[index].limit) : '6';
    return _SearchAPI.default.search(requestParams.set(query));
  }));

  return listsData;
}

class PageView extends _RouteHandler.default {
  static async requestState(requestParams) {
    const page = await _PagesAPI.default.getById(requestParams);

    const listsData = prepareLists(page.metadata.content, requestParams);
    const dataSets = _Markdown.markdownDatasets.fetch(page.metadata.content, requestParams.onlyHeaders());

    const [pageView, searchParams, searchOptions, datasets, listSearchs] =
    await Promise.all([page, listsData.params, listsData.options, dataSets, listsData.searchs]);

    const itemLists = searchParams.map((p, index) => ({
      params: p,
      items: listSearchs[index].rows,
      options: searchOptions[index] }));


    return [
    _BasicReducer.actions.set('page/pageView', pageView),
    _BasicReducer.actions.set('page/itemLists', itemLists),
    _BasicReducer.actions.set('page/datasets', datasets)];

  }

  closeSidePanel() {
    (0, _Multireducer.wrapDispatch)(this.context.store.dispatch, 'library')((0, _libraryActions.unselectAllDocuments)());
  }

  componentDidMount() {
    this.closeSidePanel();
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.closeSidePanel();
    this.context.store.dispatch(_BasicReducer.actions.unset('page/pageView'));
    this.context.store.dispatch(_BasicReducer.actions.unset('page/itemLists'));
    this.context.store.dispatch(_BasicReducer.actions.unset('page/datasets'));
  }

  setReduxState(state) {
    this.context.store.dispatch(_BasicReducer.actions.set('page/pageView', state.page.pageView));
    this.context.store.dispatch(_BasicReducer.actions.set('page/itemLists', state.page.itemLists));
    this.context.store.dispatch(_BasicReducer.actions.set('page/datasets', state.page.datasets));
  }

  render() {
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx(_PageViewer.default, {}),
      _jsx(_ViewMetadataPanel.default, { storeKey: "library" }),
      _jsx(_SelectMultiplePanelContainer.default, { storeKey: "library" })));


  }}var _default =


PageView;exports.default = _default;