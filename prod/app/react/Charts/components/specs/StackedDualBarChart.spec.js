"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _StackedDualBarChart = _interopRequireDefault(require("../StackedDualBarChart"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('StackedDualBarChart', () => {
  let props;

  beforeEach(() => {
    props = {};
  });

  function testSnapshot() {
    const tree = (0, _enzyme.shallow)(_react.default.createElement(_StackedDualBarChart.default, props));
    expect(tree).toMatchSnapshot();
  }

  it('should render a BarChart with default values', () => {
    testSnapshot();
  });

  it('should allow overriding default data and label and map the Legend payload', () => {
    props = {
      data: [{ name: 'd1' }, { name: 'd2' }],
      chartLabel: 'someLabel' };


    testSnapshot();
  });
});