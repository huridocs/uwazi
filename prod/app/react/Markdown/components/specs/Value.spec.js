"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _Context = _interopRequireDefault(require("../Context"));
var _Value = require("../Value.js");
var _markdownDatasets = _interopRequireDefault(require("../../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

let undefinedValue;

describe('Value', () => {
  it('should render the value passed by mapStateToProps', () => {
    spyOn(_markdownDatasets.default, 'getMetadataValue').and.returnValue('some metadata value');
    const props = { property: 'propValue' };
    const mappedProps = (0, _Value.mapStateToProps)('state', props);
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Value.ValueComponent, Object.assign({}, props, mappedProps)));

    expect(_markdownDatasets.default.getMetadataValue).toHaveBeenCalledWith('state', { property: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when value is "null"', () => {
    spyOn(_markdownDatasets.default, 'getMetadataValue').and.returnValue(undefinedValue);
    const props = { property: 'propValue2' };
    const mappedProps = (0, _Value.mapStateToProps)('state', props);
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Value.ValueComponent, Object.assign({}, props, mappedProps)));

    expect(_markdownDatasets.default.getMetadataValue).toHaveBeenCalledWith('state', { property: 'propValue2' });
    expect(component).toMatchSnapshot();
  });

  describe('when using the context', () => {
    it('should render the value in the context path', () => {
      const rendered = (0, _enzyme.render)(
      _jsx("span", {}, void 0,
      _jsx(_Context.default.Provider, { value: { name: 'Bruce Wayne' } }, void 0,
      _jsx(_Value.ValueComponent, { path: "name" }))));



      expect(rendered).toMatchSnapshot();
    });
  });
});