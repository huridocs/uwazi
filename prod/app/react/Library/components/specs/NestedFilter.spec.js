"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _NestedFilter = _interopRequireDefault(require("../NestedFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NestedFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
      property: { name: 'property' },
      aggregations: _immutable.default.fromJS({ aggregations: 1 }) };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_NestedFilter.default, props));
    expect(component).toMatchSnapshot();
  });
});