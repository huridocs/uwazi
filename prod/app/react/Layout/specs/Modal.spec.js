"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Modal = _interopRequireDefault(require("../Modal"));
var _reactModal = _interopRequireDefault(require("react-modal"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Modal', () => {
  let component;

  const render = (props = {}) => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Modal.default, props, _jsx("div", {})));
  };

  it('should pass isOpen props', () => {
    render({ isOpen: false });
    expect(component.find(_reactModal.default).props().isOpen).toBe(false);
    render({ isOpen: true });
    expect(component.find(_reactModal.default).props().isOpen).toBe(true);
  });

  it('should append type passed to modal class and render default success if nothing passed', () => {
    render({ type: 'modalType' });
    expect(component.find(_reactModal.default).hasClass('modal-modalType')).toBe(true);
    render();
    expect(component.find(_reactModal.default).hasClass('modal-success')).toBe(true);
  });
});