import React from 'react';
import {shallow} from 'enzyme';

import moment from 'moment-timezone';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

describe('DatePicker', () => {
  let component;
  let props;
  let date = moment.utc('2016-07-28T00:00:00+00:00');

  beforeEach(() => {
    props = {
      value: date.format('X'),
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<DatePicker {...props}/>);
  };

  it('should render a DatePickerComponent with the date passed', () => {
    render();
    let input = component.find(DatePickerComponent);
    expect(input.props().selected.toString()).toEqual(date.toString());
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      let input = component.find(DatePickerComponent);
      input.simulate('change', date);
      expect(props.onChange).toHaveBeenCalledWith('1469664000');
    });

    describe('when clearing the input', () => {
      it('should return empty value', () => {
        render();
        let input = component.find(DatePickerComponent);
        input.simulate('change');
        expect(props.onChange).toHaveBeenCalledWith();
      });
    });

    describe('when passing endOfDay flag', () => {
      it('should set the value to the end of the day', () => {
        props.endOfDay = true;
        render();
        let input = component.find(DatePickerComponent);
        input.simulate('change', date);
        expect(props.onChange).toHaveBeenCalledWith('1469750399');
      });
    });

    fdescribe('when the value is not utc', () => {
      it('should add the utc offset to the value', () => {
        render();
        let input = component.find(DatePickerComponent);

        let twoHoursFromUtc = moment('2016-07-28T00:00:00+02:00').tz('Europe/Madrid');
        input.simulate('change', twoHoursFromUtc);
        expect(props.onChange).toHaveBeenCalledWith('1469664000');

        let twoHoursAfterUtc = moment('2016-07-28T00:00:00-02:00').tz('Europe/Madrid');
        input.simulate('change', twoHoursAfterUtc);
        expect(props.onChange).toHaveBeenCalledWith('1469664000');
      });
    });
  });
});
