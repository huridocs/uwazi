import React from 'react';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { getUnixTime } from 'date-fns';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('DatePicker', () => {
  let component;
  let props;
  let input;

  const date = new Date('2016-07-28T00:00:00Z');

  beforeEach(() => {
    props = {
      value: getUnixTime(date),
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    const store = mockStore({});
    component = shallow(<DatePicker {...props} store={store} />).dive();
    input = component.find(DatePickerComponent);
  };

  it('should render a DatePickerComponent with the correct date transformed to local value', () => {
    render();
    expect(input.props().selected).toBe(new Date('2016-07-28').getTime());
  });

  describe('when useTimezone is true', () => {
    it('should render a DatePickerComponent without transforming the value to local', () => {
      props.useTimezone = true;
      render();
      expect(input.props().selected).toBe(date.getTime());
    });
  });

  describe('when date is in a diferent timezone than today', () => {
    it.each([
      { timezone: 'Japan', dateToTest: '1950-08-05' },
      { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
    ])('should use the timestamp offsetting to UTC %s', ({ timezone, dateToTest }) => {
      const newDate = new Date(`${dateToTest}T00:00:00Z`);
      props.value = getUnixTime(newDate);

      render();
      expect(input.props().selected).toBe(new Date(dateToTest).getTime());
    });

    it.each([
      { timezone: 'Japan', dateToTest: '1950-08-05' },
      { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
      { timezone: 'Europe/Madrid', dateToTest: '2020-08-18' },
    ])('should set the value to timestamp offsetting to UTC %s', ({ timezone, dateToTest }) => {
      const newDate = new Date(dateToTest);
      render();
      input.simulate('change', newDate);
      expect(props.onChange).toHaveBeenCalledWith(getUnixTime(new Date(`${dateToTest}T00:00:00Z`)));
    });
  });

  describe('When locale is a non-latin locale', () => {
    it('should render a latin-based value (until correct locales are implemented)', () => {
      render();
      expect(input.props().selected).toBe(new Date('2016-07-28').getTime());
    });

    it('should not fail on change', () => {
      const newDate = new Date('2020-08-18');
      render();
      input.simulate('change', newDate);
      expect(props.onChange).toHaveBeenCalledWith(getUnixTime(new Date('2020-08-18T00:00:00Z')));
    });
  });

  describe('when clearing the input', () => {
    it('should return empty value', () => {
      render();
      input.simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('when passing endOfDay flag', () => {
    it('should set the value to the end of the day offsetting to UTC', () => {
      const newDate = new Date('2020-08-18');
      props.endOfDay = true;
      render();
      input.simulate('change', newDate);
      // The value should be end of day in UTC
      const expectedDate = new Date('2020-08-18T23:59:59.999Z');
      const offsetMinutes = newDate.getTimezoneOffset();
      const adjustedDate = new Date(expectedDate.getTime() - offsetMinutes * 60 * 1000);
      expect(props.onChange).toHaveBeenCalledWith(getUnixTime(adjustedDate));
    });
  });

  describe('when useTimezone is true (for activity log, etc)', () => {
    let newDate;
    beforeEach(() => {
      newDate = new Date('2020-08-18');
      props.useTimezone = true;
    });

    it('should set the value to timestamp NOT offsetting to UTC', () => {
      render();
      input.simulate('change', newDate);
      expect(props.onChange).toHaveBeenCalledWith(getUnixTime(newDate));
    });

    it('should set the value to the end of the day NOT offsetting to UTC', () => {
      props.endOfDay = true;
      render();
      input.simulate('change', newDate);
      const expectedDate = new Date('2020-08-18T23:59:59.999Z');
      expect(props.onChange).toHaveBeenCalledWith(getUnixTime(expectedDate));
    });
  });
});
