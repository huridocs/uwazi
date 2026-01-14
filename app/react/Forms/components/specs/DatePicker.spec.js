import React from 'react';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { DateTime, Settings } from 'luxon';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('DatePicker', () => {
  let component;
  let props;
  let input;

  const date = DateTime.fromISO('2016-07-28T00:00:00+00:00', { zone: 'utc' });

  beforeEach(() => {
    props = {
      value: Math.floor(date.toSeconds()),
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
    expect(input.props().selected).toBe(
      parseInt(DateTime.fromISO('2016-07-28').toMillis().toString(), 10)
    );
  });

  describe('when useTimezone is true', () => {
    it('should render a DatePickerComponent without transforming the value to local', () => {
      props.useTimezone = true;
      render();
      expect(input.props().selected).toBe(parseInt(date.toMillis().toString(), 10));
    });
  });

  afterEach(() => {
    Settings.defaultZone = 'local';
  });

  describe('when date is in a diferent timezone than today', () => {
    it.each([
      { timezone: 'Asia/Tokyo', dateToTest: '1950-08-05' },
      { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
    ])('should use the timestamp offsetting to UTC %s', ({ timezone, dateToTest }) => {
      Settings.defaultZone = timezone;
      const newDate = DateTime.fromISO(dateToTest, { zone: 'utc' });
      props.value = Math.floor(newDate.toSeconds());

      render();
      expect(input.props().selected).toBe(
        parseInt(DateTime.fromISO(dateToTest).toMillis().toString(), 10)
      );
    });

    it.each([
      { timezone: 'Asia/Tokyo', dateToTest: '1950-08-05' },
      { timezone: 'Europe/Madrid', dateToTest: '1973-08-18' },
      { timezone: 'Europe/Madrid', dateToTest: '2020-08-18' },
    ])('should set the value to timestamp offsetting to UTC %s', ({ timezone, dateToTest }) => {
      Settings.defaultZone = timezone;
      const newDate = DateTime.fromISO(dateToTest).toJSDate();
      render();
      input.simulate('change', newDate);
      expect(props.onChange).toHaveBeenCalledWith(
        Math.floor(DateTime.fromISO(dateToTest, { zone: 'utc' }).toSeconds())
      );
    });
  });

  describe('When locale is a non-latin locale', () => {
    let originalLocale;

    beforeEach(() => {
      originalLocale = Settings.defaultLocale;
      Settings.defaultLocale = 'ar';
    });

    afterEach(() => {
      Settings.defaultLocale = originalLocale;
    });

    it('should render a latin-based value (until correct locales are implemented)', () => {
      render();
      expect(input.props().selected).toBe(
        parseInt(DateTime.fromISO('2016-07-28').toMillis().toString(), 10)
      );
    });

    it('should not fail on change', () => {
      Settings.defaultZone = 'Europe/Madrid';
      const newDate = DateTime.fromISO('2020-08-18').toJSDate();
      render();
      input.simulate('change', newDate);
      expect(props.onChange).toHaveBeenCalledWith(
        Math.floor(DateTime.fromISO('2020-08-18', { zone: 'utc' }).toSeconds())
      );
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
      const expectedOnChangeValue = DateTime.fromJSDate(newDate, { zone: 'utc' })
        .plus({ minutes: DateTime.local().offset })
        .endOf('day');
      expect(props.onChange).toHaveBeenCalledWith(Math.floor(expectedOnChangeValue.toSeconds()));
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
      const expectedOnChangeValue = DateTime.fromJSDate(newDate, { zone: 'utc' });
      expect(props.onChange).toHaveBeenCalledWith(Math.floor(expectedOnChangeValue.toSeconds()));
    });

    it('should set the value to the end of the day NOT offsetting to UTC', () => {
      props.endOfDay = true;
      render();
      input.simulate('change', newDate);
      const expectedOnChangeValue = DateTime.fromJSDate(newDate, { zone: 'utc' })
        .setZone('local')
        .endOf('day');
      expect(props.onChange).toHaveBeenCalledWith(Math.floor(expectedOnChangeValue.toSeconds()));
    });
  });

  describe('Locale handling', () => {
    it('should pass locale prop to DatePickerComponent', () => {
      props.locale = 'ar';
      render();
      expect(input.props().locale).toBe('ar');
    });

    it('should use default locale "en" when no locale is provided', () => {
      render();
      expect(input.props().locale).toBe('en');
    });

    it('should get locale from Redux state when not provided as prop', () => {
      const storeWithLocale = mockStore({ locale: 'ar' });
      component = shallow(<DatePicker {...props} store={storeWithLocale} />).dive();
      input = component.find(DatePickerComponent);

      expect(input.props().locale).toBe('ar');
    });

    it('should prioritize prop locale over Redux state locale', () => {
      props.locale = 'es';
      const storeWithLocale = mockStore({ locale: 'ar' });
      component = shallow(<DatePicker {...props} store={storeWithLocale} />).dive();
      input = component.find(DatePickerComponent);

      expect(input.props().locale).toBe('es');
    });

    it('should pass locale to DatePickerComponent for localization', () => {
      props.locale = 'fr';
      render();
      const datePickerProps = input.props();

      expect(datePickerProps.locale).toBe('fr');
    });
  });
});
