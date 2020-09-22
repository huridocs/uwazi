import React from 'react';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import baseMoment from 'moment';
import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

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
    const store = mockStore({});
    component = shallow(<DatePicker {...props} store={store} />).dive();
    input = component.find(DatePickerComponent);
  };

  const expectCorrectSelectedValue = () => {
    render();
    const expectedSelectedValue = date.clone().subtract(moment().utcOffset(), 'minute');
    expect(input.props().selected).toBe(parseInt(expectedSelectedValue.format('x'), 10));
  };

  it('should render a DatePickerComponent with the correct transformed to local value', () => {
    expectCorrectSelectedValue();
  });

  describe('when useTimezone is true', () => {
    it('should render a DatePickerComponent without transforming the value to local', () => {
      props.useTimezone = true;
      render();
      expect(input.props().selected).toBe(parseInt(date.format('x'), 10));
    });
  });

  describe('onChange', () => {
    const expectCorrectOnChange = () => {
      const newDate = new Date('2020-08-18');
      render();
      input.simulate('change', newDate);
      const expectedOnChangeValue = moment.utc(newDate).add(moment().utcOffset(), 'minute');
      expect(props.onChange).toHaveBeenCalledWith(Number(expectedOnChangeValue.format('X')));
    };

    it('should set the value to timestamp offsetting to UTC', () => {
      expectCorrectOnChange();
    });

    describe('When locale is a non-latin locale', () => {
      let originalLocale;

      beforeEach(() => {
        originalLocale = baseMoment.locale();
        baseMoment.locale('ar');
      });

      afterEach(() => {
        baseMoment.locale(originalLocale);
      });

      it('should render a latin-based value (until correct locales are implemented)', () => {
        expectCorrectSelectedValue();
      });

      it('should not fail on change', () => {
        expectCorrectOnChange();
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
        const expectedOnChangeValue = moment
          .utc(newDate)
          .add(moment().utcOffset(), 'minute')
          .endOf('day');
        expect(props.onChange).toHaveBeenCalledWith(Number(expectedOnChangeValue.format('X')));
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
        const expectedOnChangeValue = moment.utc(newDate);
        expect(props.onChange).toHaveBeenCalledWith(Number(expectedOnChangeValue.format('X')));
      });

      it('should set the value to the end of the day NOT offsetting to UTC', () => {
        props.endOfDay = true;
        render();
        input.simulate('change', newDate);
        const expectedOnChangeValue = moment
          .utc(newDate)
          .local()
          .endOf('day');
        expect(props.onChange).toHaveBeenCalledWith(Number(expectedOnChangeValue.format('X')));
      });
    });
  });
});
