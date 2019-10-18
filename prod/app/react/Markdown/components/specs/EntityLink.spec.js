"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _reactRedux = require("react-redux");
var _redux = require("redux");
var _EntityLink = _interopRequireDefault(require("../EntityLink.js"));
var _Context = _interopRequireDefault(require("../Context"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('EntityLink', () => {
  let props;
  let entity;
  const store = (0, _redux.createStore)(() => ({}));

  beforeEach(() => {
    entity = { _id: '123', sharedId: 'abc' };
    props = {
      children: 'I want this as the link content' };

  });

  it('should generate a link based on the entity sharedId and if it has file or not', () => {
    const component = (0, _enzyme.shallow)(
    _jsx(_reactRedux.Provider, { store: store }, void 0,
    _jsx(_Context.default.Provider, { value: entity }, void 0,
    _react.default.createElement(_EntityLink.default, props))));



    expect(component).toMatchSnapshot();
  });

  it('should generate a link to the document viewer when it has file', () => {
    entity.file = {};
    const component = (0, _enzyme.shallow)(
    _jsx(_reactRedux.Provider, { store: store }, void 0,
    _jsx(_Context.default.Provider, { value: entity }, void 0,
    _react.default.createElement(_EntityLink.default, props))));



    expect(component).toMatchSnapshot();
  });
});