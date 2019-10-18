"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.TocForm = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactReduxForm = require("react-redux-form");
var _UI = require("../../UI");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TocForm extends _react.Component {
  indentButton(direction, tocElement) {
    const { indent } = this.props;
    const onClick = indent.bind(null, tocElement, tocElement.indentation + (direction === 'more' ? 1 : -1));
    return (
      _jsx("button", { type: "button", onClick: onClick, className: `toc-indent-${direction} btn btn-default` }, void 0,
      _jsx(_UI.Icon, { icon: direction === 'more' ? 'arrow-right' : 'arrow-left', directionAware: true })));


  }

  render() {
    const { toc, model, removeEntry, onSubmit } = this.props;
    return (
      _jsx(_reactReduxForm.Form, { className: "toc", id: "tocForm", model: model, onSubmit: onSubmit }, void 0,
      toc.map((tocElement, index) =>
      _jsx("div", { className: `toc-indent-${tocElement.indentation}` }, index,
      _jsx("div", { className: "toc-edit" }, void 0,
      this.indentButton('less', tocElement),
      this.indentButton('more', tocElement),
      _jsx(_reactReduxForm.Field, { model: `${model}[${index}].label` }, void 0,
      _jsx("input", { className: "form-control" })),

      _jsx("button", { type: "button", onClick: removeEntry.bind(this, tocElement), className: "btn btn-danger" }, void 0,
      _jsx(_UI.Icon, { icon: "trash-alt" })))))));






  }}exports.TocForm = TocForm;


TocForm.defaultProps = {
  toc: [],
  removeEntry: () => {},
  indent: () => {},
  onSubmit: () => {} };var _default =










TocForm;exports.default = _default;