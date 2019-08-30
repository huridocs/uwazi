import React from 'react';
import { shallow } from 'enzyme';

import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

describe('DatePicker', () => {
  let component;
  let props;
  const date = moment('2016-07-28T00:00:00+00:00');

  beforeEach(() => {
    props = {
      value: date.format('X'),
      onChange: jasmine.createSpy('onChange')
    };
  });

  const render = () => {
    component = shallow(<DatePicker {...props}/>);
  };

  it('should render a DatePickerComponent with the date passed', () => {
    render();
    const input = component.find(DatePickerComponent);
    expect(input.props().selected.toUTCString()).toEqual(date.toDate().toUTCString());
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      const input = component.find(DatePickerComponent);
      input.simulate('change', date.toDate());
      expect(props.onChange).toHaveBeenCalledWith(1469664000);
    });

    describe('when clearing the input', () => {
      it('should return empty value', () => {
        render();
        const input = component.find(DatePickerComponent);
        input.simulate('change');
        expect(props.onChange).toHaveBeenCalledWith(null);
      });
    });

    describe('when passing endOfDay flag', () => {
      it('should set the value to the end of the day', () => {
        props.endOfDay = true;
        render();
        const input = component.find(DatePickerComponent);
        input.simulate('change', date.toDate());
        expect(props.onChange).toHaveBeenCalledWith(1469750399);
      });
    });

    describe('when the value is not utc', () => {
      it('should add the utc offset to the value', () => {
        render();
        const input = component.find(DatePickerComponent);

        const twoHoursFromUtc = moment('2016-07-28T00:00:00+02:00').tz('Europe/Madrid').toDate();
        input.simulate('change', twoHoursFromUtc);
        expect(props.onChange).toHaveBeenCalledWith(1469664000);

        const twoHoursAfterUtc = moment('2016-07-28T00:00:00-02:00').tz('Europe/Madrid').toDate();
        input.simulate('change', twoHoursAfterUtc);
        expect(props.onChange).toHaveBeenCalledWith(1469664000);
      });
    });
  });
});
