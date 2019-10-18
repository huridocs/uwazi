"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _Counter = _interopRequireWildcard(require("../Counter.js"));
var _markdownDatasets = _interopRequireDefault(require("../../markdownDatasets"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Counter', () => {
  it('should render the count passed by mapStateToProps', () => {
    spyOn(_markdownDatasets.default, 'getAggregation').and.returnValue(5);
    const props = (0, _Counter.mapStateToProps)('state', { prop1: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Counter.default.WrappedComponent, props));

    expect(_markdownDatasets.default.getAggregation).toHaveBeenCalledWith('state', { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  it('should render a placeholder when count is "null"', () => {
    let undefinedValue;
    spyOn(_markdownDatasets.default, 'getAggregation').and.returnValue(undefinedValue);
    const props = (0, _Counter.mapStateToProps)('state', { prop1: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Counter.default.WrappedComponent, props));

    expect(_markdownDatasets.default.getAggregation).toHaveBeenCalledWith('state', { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
  });
});