"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = _interopRequireDefault(require("immutable"));

var _Connect = _interopRequireDefault(require("../Connect"));
var _Value = _interopRequireDefault(require("../Value"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Connect', () => {
  const DummyComponent = p => _jsx("span", {}, void 0, p.myvalue);
  let store = (0, _redux.createStore)(() => ({ cats: [{ name: 'Calcetines' }, { name: 'Zapatilla' }] }));
  it('should pass a value in the store to the child component ', () => {
    const component = (0, _enzyme.render)(
    _jsx(_reactRedux.Provider, { store: store }, void 0,
    _jsx(_Connect.default, { myvalue: "cats.0.name" }, void 0,
    _jsx(DummyComponent, {}))));



    expect(component).toMatchSnapshot();
  });

  it('should pass a value in the store to the child component even whith immutables', () => {
    store = (0, _redux.createStore)(() => ({ cats: _immutable.default.fromJS([{ name: 'Calcetines' }, { name: 'Zapatilla' }]) }));
    const component = (0, _enzyme.render)(
    _jsx(_reactRedux.Provider, { store: store }, void 0,
    _jsx(_Connect.default, { myvalue: "cats.1.name" }, void 0,
    _jsx(DummyComponent, {}))));



    expect(component).toMatchSnapshot();
  });

  it('should expose the values in the context', () => {
    const component = (0, _enzyme.render)(
    _jsx(_reactRedux.Provider, { store: store }, void 0,
    _jsx("span", {}, void 0,
    _jsx(_Connect.default, { cats: "cats" }, void 0,
    _jsx(_Value.default, { path: "cats.0.name" })))));




    expect(component).toMatchSnapshot();
  });
});