"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _PieChartLabel = _interopRequireDefault(require("../PieChartLabel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PieChart Label', () => {
  it('should render label', () => {
    const props = {
      cx: 500,
      cy: 111,
      data: [{ label: 'label1' }, { label: 'label2' }],
      index: 1,
      value: 30,
      midAngle: 359,
      outerRadius: 105,
      innerRadius: 50 };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_PieChartLabel.default, props));
    expect(component).toMatchSnapshot();
  });
});