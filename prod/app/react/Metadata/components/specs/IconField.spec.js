"use strict";var _react = _interopRequireDefault(require("react"));

var _Forms = require("../../../Forms");
var _enzyme = require("enzyme");
var _ToggleDisplay = _interopRequireDefault(require("../../../Layout/ToggleDisplay"));

var _IconField = require("../IconField");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

describe('IconField', () => {
  let props;
  beforeEach(() => {
    props = {
      removeIcon: jasmine.createSpy('removeIcon') };

  });
  it('should render IconSelector with toggleDisplay', () => {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_IconField.IconField, _extends({}, props, { model: "model.value" }))).find(_Forms.FormValue).prop('children')();
    expect(component).toMatchSnapshot();
  });

  it('should be open when has value', () => {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_IconField.IconField, _extends({}, props, { model: "model.value" }))).find(_Forms.FormValue).prop('children')({ _id: 'id' });
    expect(component).toMatchSnapshot();
  });

  it('should call removeIcon on hide', () => {
    const component = (0, _enzyme.shallow)(_jsx("span", {}, void 0, (0, _enzyme.shallow)(_react.default.createElement(_IconField.IconField, _extends({}, props, { model: "model.value" }))).find(_Forms.FormValue).prop('children')('value')));
    component.find(_ToggleDisplay.default).props().onHide();
    expect(props.removeIcon).toHaveBeenCalledWith('model.value.icon');
  });
});