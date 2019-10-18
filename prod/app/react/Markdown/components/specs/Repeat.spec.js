"use strict";var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _enzyme = require("enzyme");

var _redux = require("redux");
var _Repeat = _interopRequireDefault(require("../Repeat"));
var _Value = _interopRequireDefault(require("../Value"));
var _Context = _interopRequireDefault(require("../Context"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Repeat', () => {
  let datasets;
  const store = (0, _redux.createStore)(() => ({}));
  class DummyComponent extends _react.Component {
    render() {
      const { myvalue } = this.props;
      return _jsx("span", {}, void 0, myvalue);
    }}


  beforeEach(() => {
    datasets = {
      data: ['Batman', 'Spiderman'] };

  });

  it('should render the items in data using the given html', () => {
    const component = (0, _enzyme.render)(
    _jsx("ul", {}, void 0,
    _jsx(_Context.default.Provider, { value: datasets }, void 0,
    _jsx(_Repeat.default, { path: "data" }, void 0,
    _jsx("li", {}, void 0, "Name: ", _jsx(_Value.default, { store: store }))))));




    expect(component).toMatchSnapshot();
  });

  it('should handle nested values in objects', () => {
    datasets = {
      data: [{ title: 'Batman', metadata: { age: 42 } }, { title: 'Robin', metadata: { age: 24 } }] };

    const component = (0, _enzyme.render)(
    _jsx(_Context.default.Provider, { value: datasets }, void 0,
    _jsx(_Repeat.default, { path: "data" }, void 0,
    _jsx("span", {}, void 0, "Name: ", _jsx(_Value.default, { store: store, path: "title" })),
    _jsx("span", {}, void 0, "Age: ", _jsx(_Value.default, { store: store, path: "metadata.age" })))));



    expect(component).toMatchSnapshot();
  });
});