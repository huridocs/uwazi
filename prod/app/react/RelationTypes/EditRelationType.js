"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));

var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _relationTypesActions = require("./actions/relationTypesActions");
var _RelationTypesAPI = _interopRequireDefault(require("./RelationTypesAPI"));
var _TemplateCreator = _interopRequireDefault(require("../Templates/components/TemplateCreator"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class EditRelationType extends _RouteHandler.default {
  static async requestState(requestParams) {
    const [relationType] = await _RelationTypesAPI.default.get(requestParams);
    relationType.properties = relationType.properties || [];

    return [
    (0, _relationTypesActions.editRelationType)(relationType)];

  }

  render() {
    return _jsx(_TemplateCreator.default, { relationType: true });
  }}exports.default = EditRelationType;