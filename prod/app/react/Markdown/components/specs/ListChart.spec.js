"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _ListChart = require("../ListChart.js");
var _markdownDatasets = _interopRequireDefault(require("../../markdownDatasets"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

describe('ListChart Markdown component', () => {
  const state = {
    thesauris: _immutable.default.fromJS([{
      _id: 'tContext',
      values: [
      { id: 'id1', label: 'label1' },
      { id: 'id2', label: 'label2' },
      { id: 'id3', label: 'label3' }] }]) };




  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(_markdownDatasets.default, 'getAggregations').and.returnValue(undefinedValue);
    const props = (0, _ListChart.mapStateToProps)(state, { prop2: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ListChart.ListChartComponent, _extends({}, props, { property: "prop2" })));

    expect(_markdownDatasets.default.getAggregations).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render the data passed by mapStateToProps', () => {
    spyOn(_markdownDatasets.default, 'getAggregations').and.returnValue(_immutable.default.fromJS([
    { key: 'id1', filtered: { doc_count: 25 } },
    { key: 'id2', filtered: { doc_count: 33 } },
    { key: 'missing', filtered: { doc_count: 45 } },
    { key: 'id3', filtered: { doc_count: 13 } }]));


    const props = (0, _ListChart.mapStateToProps)(state, { prop1: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ListChart.ListChartComponent, _extends({}, props, { property: "prop1", classname: "custom-class", context: "tContext" })));

    expect(_markdownDatasets.default.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });
  describe('when excludeZero', () => {
    it('should render without zero values', () => {
      spyOn(_markdownDatasets.default, 'getAggregations').and.returnValue(_immutable.default.fromJS([
      { key: 'id1', filtered: { doc_count: 25 } },
      { key: 'id2', filtered: { doc_count: 33 } },
      { key: 'missing', filtered: { doc_count: 45 } },
      { key: 'id3', filtered: { doc_count: 0 } }]));


      const props = (0, _ListChart.mapStateToProps)(state, { prop1: 'propValue' });
      props.excludeZero = 'true';
      const component = (0, _enzyme.shallow)(_react.default.createElement(_ListChart.ListChartComponent, _extends({}, props, { property: "prop1", classname: "custom-class", context: "tContext" })));

      expect(_markdownDatasets.default.getAggregations).toHaveBeenCalledWith(state, { prop1: 'propValue' });
      expect(component).toMatchSnapshot();
    });
  });
});