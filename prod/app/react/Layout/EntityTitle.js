"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapStateToProps = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactRedux = require("react-redux");
var _reselect = require("reselect");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const getTitle = (0, _reselect.createSelector)(
s => s.thesauris,
(s, p) => p.entity,
(s, p) => p.context,
(thesauris, entity, context) => {
  const thesauri = thesauris.find(t => t.get('type') === 'template' && t.get('_id').toString() === context.toString());
  return thesauri.get('values').find(v => v.get('id') === entity).get('label');
});


const EntityTitle = ({ title }) =>
_jsx("span", { className: "entity-title" }, void 0, title);


EntityTitle.defaultProps = {
  title: '' };






const mapStateToProps = (state, props) => ({
  title: getTitle(state, props) });exports.mapStateToProps = mapStateToProps;var _default =


(0, _reactRedux.connect)(mapStateToProps)(EntityTitle);exports.default = _default;