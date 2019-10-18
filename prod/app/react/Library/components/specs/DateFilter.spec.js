"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _DateFilter = _interopRequireDefault(require("../DateFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DateFilter', () => {
  it('should render a date filter field with a label and passing the model and format', () => {
    const props = {
      label: 'label',
      model: 'model',
      format: 'format' };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_DateFilter.default, props));
    expect(component).toMatchSnapshot();
  });
});