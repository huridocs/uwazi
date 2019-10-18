"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _MarkdownLink = _interopRequireDefault(require("../MarkdownLink.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Link', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });
  it('should render a react-router Link', () => {
    const component = (0, _enzyme.shallow)(_jsx(_MarkdownLink.default, { url: "url" }, void 0, "label"));
    expect(component).toMatchSnapshot();
  });

  it('should allow to set a custom class to the component', () => {
    const component = (0, _enzyme.shallow)(_jsx(_MarkdownLink.default, { url: "url", className: "custom class" }, void 0, "label"));
    expect(component).toMatchSnapshot();
  });

  it('should allow nesting children inside', () => {
    const component = (0, _enzyme.shallow)(_jsx(_MarkdownLink.default, { url: "url" }, void 0, _jsx("div", {}, void 0, "Extra content"), _jsx("span", {}, void 0, "Label")));
    expect(component).toMatchSnapshot();
  });
});