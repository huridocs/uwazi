import React from 'react';
import { shallow } from 'enzyme';

import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

describe('DatePicker', () => {
  let component;
  let props;
  let input;

  const date = moment.utc('2016-07-28T00:00:00+00:00');

  beforeEach(() => {
    props = {
      value: Number(date.format('X')),
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<DatePicker {...props} />);
    input = component.find(DatePickerComponent);
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

        const twoHoursFromUtc = moment('2016-07-28T00:00:00+02:00').tz('Europe/Madrid');
        input.simulate('change', twoHoursFromUtc);
        expect(props.onChange).toHaveBeenCalledWith(first);

        const twoHoursAfterUtc = moment('2016-07-28T00:00:00-02:00').tz('Europe/Madrid');
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
