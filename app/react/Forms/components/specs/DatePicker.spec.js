import React from 'react';
import {shallow} from 'enzyme';

import moment from 'moment';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

describe('DatePicker', () => {
  let component;
  let props;
  let date = moment('1469743200', 'X');

  beforeEach(() => {
    props = {
      value: '1469743200',
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<DatePicker {...props}/>);
  };

  it('should render a DatePickerComponent with the date passed', () => {
    render();
    let input = component.find(DatePickerComponent);
    expect(input.props().selected).toEqual(date);
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      let input = component.find(DatePickerComponent);
      input.simulate('change', date);
      expect(props.onChange).toHaveBeenCalledWith('1469743200');
    });

    describe('when passing endOfDay flag', () => {
      it('should set the value to the end of the day', () => {
        props.endOfDay = true;
        render();
        let input = component.find(DatePickerComponent);
        input.simulate('change', date);
        expect(props.onChange).toHaveBeenCalledWith('1469829599');
      });
    });
  });
});
