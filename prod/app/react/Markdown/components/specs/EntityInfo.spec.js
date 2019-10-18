"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _EntityInfo = _interopRequireWildcard(require("../EntityInfo.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('EntityInfo', () => {
  let props;
  let component;
  let actions;
  const dispatch = () => {};

  const render = customProps => {
    props = {
      entity: 'sharedId',
      classname: 'passed classnames',
      children: [_jsx("span", {}, "1", "multiple"), _jsx("b", {}, "2", "children")] };

    actions = (0, _EntityInfo.mapDispatchToProps)(dispatch);
    spyOn(actions, 'getAndSelectDocument');
    const mappedProps = _objectSpread({}, props, {}, customProps, {}, actions);
    component = (0, _enzyme.shallow)(_react.default.createElement(_EntityInfo.default.WrappedComponent, mappedProps));
  };

  it('should wrap children in a div, passing classname', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should allow changing the tag wrapping element', () => {
    render({ tag: 'p' });
    expect(component).toMatchSnapshot();
  });

  it('should get and select the entity', () => {
    render();
    component.simulate('click');
    expect(actions.getAndSelectDocument).toHaveBeenCalledWith('sharedId');
  });
});