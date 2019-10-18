"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));

var _BasicReducer = require("../BasicReducer");
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _SearchButton = _interopRequireDefault(require("./components/SearchButton"));
var _RelationTypesAPI = _interopRequireDefault(require("../RelationTypes/RelationTypesAPI"));
var relationships = _interopRequireWildcard(require("../Relationships/utils/routeUtils"));

var _EntityViewer = _interopRequireDefault(require("./components/EntityViewer"));
var _EntitiesAPI = _interopRequireDefault(require("./EntitiesAPI"));
var uiActions = _interopRequireWildcard(require("./actions/uiActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Entity extends _RouteHandler.default {
  static async requestState(requestParams, state) {
    const [[entity], relationTypes, [connectionsGroups, searchResults, sort, filters]] =
    await Promise.all([
    _EntitiesAPI.default.get(requestParams.set({ sharedId: requestParams.data.sharedId })),
    _RelationTypesAPI.default.get(requestParams.onlyHeaders()),
    relationships.requestState(requestParams, state)]);


    return [
    _BasicReducer.actions.set('relationTypes', relationTypes),
    _BasicReducer.actions.set('entityView/entity', entity),
    relationships.setReduxState({
      relationships: {
        list: {
          sharedId: entity.sharedId,
          entity,
          connectionsGroups,
          searchResults,
          sort,
          filters,
          view: 'graph' } } })];




  }

  componentWillMount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(_BasicReducer.actions.unset('entityView/entity'));
    this.context.store.dispatch(relationships.emptyState());
  }

  static renderTools() {
    return (
      _jsx("div", { className: "searchBox" }, void 0,
      _jsx(_SearchButton.default, { storeKey: "library" })));


  }

  render() {
    return _jsx(_EntityViewer.default, {});
  }}exports.default = Entity;