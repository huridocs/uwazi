"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _NumberRangeFilter = _interopRequireDefault(require("../NumberRangeFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NumberRangeFilter', () => {
  it('should render a NumberRangeFilter filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model' };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_NumberRangeFilter.default, props));
    expect(component).toMatchSnapshot();
  });
});