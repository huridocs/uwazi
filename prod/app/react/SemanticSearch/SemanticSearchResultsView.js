"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));

var _BasicReducer = require("../BasicReducer");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _SearchButton = _interopRequireDefault(require("../Library/components/SearchButton"));

var _SemanticSearchResults = _interopRequireDefault(require("./components/SemanticSearchResults"));
var _SemanticSearchAPI = _interopRequireDefault(require("./SemanticSearchAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class SemanticSearchResultsView extends _RouteHandler.default {
  static async requestState(requestParams, state) {
    const filters = state.semanticSearch ?
    state.semanticSearch.resultsFilters : { threshold: 0.4, minRelevantSentences: 5 };
    const args = requestParams.add(filters);
    const search = await _SemanticSearchAPI.default.getSearch(args);
    return [
    _BasicReducer.actions.set('semanticSearch/search', search)];

  }

  static renderTools() {
    return (
      _jsx("div", { className: "searchBox" }, void 0,
      _jsx(_SearchButton.default, { storeKey: "library" })));


  }

  render() {
    return _jsx(_SemanticSearchResults.default, {});
  }}exports.default = SemanticSearchResultsView;