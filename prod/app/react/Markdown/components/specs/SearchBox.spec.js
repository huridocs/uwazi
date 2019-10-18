"use strict";var _reactReduxForm = require("react-redux-form");
var _reactRouter = require("react-router");
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _SearchBox = _interopRequireDefault(require("../SearchBox"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('SearchBox', () => {
  let component;

  beforeEach(() => {
    component = (0, _enzyme.shallow)(_jsx(_SearchBox.default, { className: "custom-class", placeholder: "placeholder text" }));
  });

  it('should render a basic input that binds to the correct model', () => {
    expect(component).toMatchSnapshot();
  });

  it('should call the search action on submit', () => {
    spyOn(_reactRouter.browserHistory, 'push');
    component.find(_reactReduxForm.Form).props().onSubmit({ searchTerm: 'text with spaces' });
    expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('/library/?q=(searchTerm:\'text with spaces\')');
  });
});