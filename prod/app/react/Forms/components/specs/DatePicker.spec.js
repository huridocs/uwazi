"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
var _reactDatepicker = _interopRequireDefault(require("react-datepicker"));
var _DatePicker = _interopRequireDefault(require("../DatePicker"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DatePicker', () => {
  let component;
  let props;
  let input;

  const date = _momentTimezone.default.utc('2016-07-28T00:00:00+00:00');

  beforeEach(() => {
    props = {
      value: Number(date.format('X')),
      onChange: jasmine.createSpy('onChange') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DatePicker.default, props));
    input = component.find(_reactDatepicker.default);
  };

  it('should render a DatePickerComponent with the date passed', () => {
    render();
    expect(input.props().selected.toString()).toEqual(date.toString());
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      input.simulate('change', date);
      expect(props.onChange).toHaveBeenCalledWith(1469664000);
    });

    describe('when clearing the input', () => {
      it('should return empty value', () => {
        render();
        input.simulate('change');
        expect(props.onChange).toHaveBeenCalledWith(null);
      });
    });

    describe('when passing endOfDay flag', () => {
      it('should set the value to the end of the day', () => {
        props.endOfDay = true;
        render();
        input.simulate('change', date);
        expect(props.onChange).toHaveBeenCalledWith(1469750399);
      });
    });

    describe('when the value is not utc', () => {
      const expectChange = (first, second) => {
        render();

        const twoHoursFromUtc = (0, _momentTimezone.default)('2016-07-28T00:00:00+02:00').tz('Europe/Madrid');
        input.simulate('change', twoHoursFromUtc);
        expect(props.onChange).toHaveBeenCalledWith(first);

        const twoHoursAfterUtc = (0, _momentTimezone.default)('2016-07-28T00:00:00-02:00').tz('Europe/Madrid');
        input.simulate('change', twoHoursAfterUtc);
        expect(props.onChange).toHaveBeenCalledWith(second);
      };

      it('should add the utc offset to the value by default', () => {
        expectChange(1469664000, 1469664000);
      });

      it('should allow to use local timezone (keep UTC offset) if configured', () => {
        props.useTimezone = true;
        expectChange(1469656800, 1469671200);
        props.endOfDay = true;
        expectChange(1469743199, 1469743199);
      });
    });
  });
});