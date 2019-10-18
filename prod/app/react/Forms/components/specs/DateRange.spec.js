"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _DateRange = _interopRequireDefault(require("../DateRange"));
var _DatePicker = _interopRequireDefault(require("../DatePicker"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DateRange', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DateRange.default, props));
  };

  beforeEach(() => {
    props = {
      onChange: jasmine.createSpy('onChange'),
      value: { from: 0, to: 1 } };


    render();
  });

  it('should render the component', () => {
    expect(component).toMatchSnapshot();
  });

  it('should allow using the local timezone', () => {
    props.useTimezone = true;
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      component.find(_DatePicker.default).first().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({ from: 1469656800, to: 1 });
      component.find(_DatePicker.default).last().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({ from: 1469656800, to: 1469656800 });
    });
  });
});