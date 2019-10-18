"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _GaugeChart = require("../GaugeChart.js");
var _markdownDatasets = _interopRequireDefault(require("../../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('GaugeChart Markdown component', () => {
  const state = {
    thesauris: _immutable.default.fromJS([{
      _id: 'tContext',
      values: [
      { id: 'id1', label: 'label1' },
      { id: 'id2', label: 'label2' },
      { id: 'id3', label: 'label3' }] }]) };




  it('should render the data passed by mapStateToProps', () => {
    spyOn(_markdownDatasets.default, 'getMetadataValue').and.returnValue(4);
    const ownProps = { property: 'progress' };
    const props = (0, _GaugeChart.mapStateToProps)(state, ownProps);
    const component = (0, _enzyme.shallow)(_react.default.createElement(_GaugeChart.GaugeChartComponent, Object.assign({}, ownProps, props)));

    expect(_markdownDatasets.default.getMetadataValue).toHaveBeenCalledWith(state, ownProps);
    expect(component).toMatchSnapshot();
  });

  it('should allow rendering value with prefix, suffix, and personalizing values', () => {
    spyOn(_markdownDatasets.default, 'getMetadataValue').and.returnValue(4);
    const ownProps = {
      dataset: 'custom dataset',
      property: 'progress',
      max: '12',
      height: '300',
      classname: 'custom-class',
      colors: '#f00,#0f0' };


    const props = (0, _GaugeChart.mapStateToProps)(state, ownProps);
    const component = (0, _enzyme.shallow)(_react.default.createElement(_GaugeChart.GaugeChartComponent, Object.assign({}, ownProps, props), "Pre ", _jsx("div", {}), " Suf"));

    expect(_markdownDatasets.default.getMetadataValue).toHaveBeenCalledWith(state, ownProps);
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(_markdownDatasets.default, 'getMetadataValue').and.returnValue(undefinedValue);

    const props = (0, _GaugeChart.mapStateToProps)(state, { prop2: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_GaugeChart.GaugeChartComponent, _extends({}, props, { property: "prop2" })));

    expect(_markdownDatasets.default.getMetadataValue).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });
});