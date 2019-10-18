"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.PaginatorWithPage = exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));

var _I18N = require("../../I18N");
var _reactRouter = require("react-router");
var _Layout = require("../../Layout");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _objectWithoutProperties(source, excluded) {if (source == null) return {};var target = _objectWithoutPropertiesLoose(source, excluded);var key, i;if (Object.getOwnPropertySymbols) {var sourceSymbolKeys = Object.getOwnPropertySymbols(source);for (i = 0; i < sourceSymbolKeys.length; i++) {key = sourceSymbolKeys[i];if (excluded.indexOf(key) >= 0) continue;if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;target[key] = source[key];}}return target;}function _objectWithoutPropertiesLoose(source, excluded) {if (source == null) return {};var target = {};var sourceKeys = Object.keys(source);var key, i;for (i = 0; i < sourceKeys.length; i++) {key = sourceKeys[i];if (excluded.indexOf(key) >= 0) continue;target[key] = source[key];}return target;}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const disableButton = (page, pageToDisable) => ({
  className: page === pageToDisable ? 'btn disabled' : 'btn',
  rel: page === pageToDisable ? 'nofollow' : undefined });


const Paginator = ({ page, totalPages, onPageChange }) => {
  const prevPage = page - 1 || 1;
  const nextPage = page + 1 > totalPages ? totalPages : page + 1;
  return (
    _jsx("div", { className: "paginator" }, void 0,
    _react.default.createElement(_Layout.CurrentLocationLink, _extends({
      queryParams: { page: prevPage },
      onClick: e => {
        e.preventDefault();
        onPageChange(prevPage);
      } },
    disableButton(page, 1)),

    _jsx(_I18N.Translate, {}, void 0, "Previous")),

    _jsx("span", {}, void 0, ` ${page} / ${totalPages} `),
    _react.default.createElement(_Layout.CurrentLocationLink, _extends({
      queryParams: { page: nextPage },
      onClick: e => {
        e.preventDefault();
        onPageChange(nextPage);
      } },
    disableButton(page, totalPages)),

    _jsx(_I18N.Translate, {}, void 0, "Next"))));



};

Paginator.defaultProps = {
  page: 1,
  totalPages: 1,
  onPageChange: () => {} };var _default =








Paginator;exports.default = _default;

const PaginatorWithPage = (0, _reactRouter.withRouter)(props => {
  const { location } = props,restProps = _objectWithoutProperties(props, ["location"]);
  return _react.default.createElement(Paginator, _extends({}, restProps, { page: Number(location.query.page || 1) }));
});exports.PaginatorWithPage = PaginatorWithPage;