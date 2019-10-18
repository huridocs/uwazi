"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _TextFilter = _interopRequireDefault(require("../TextFilter"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('TextFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model' };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_TextFilter.default, props));
    expect(component).toMatchSnapshot();
  });
});