import React from 'react';
import {shallow} from 'enzyme';

import moment from 'moment';
import DatePickerComponent from 'react-datepicker';
import DatePicker from '../DatePicker';

describe('Select', () => {
  let component;
  let props;
  let date = moment('1469743200', 'X');

  beforeEach(() => {
    props = {value: '1469743200'};
  });

  let render = () => {
    component = shallow(<DatePicker {...props}/>);
  };

  it('should render a DatePickerComponent with the date passed', () => {
    render();
    let input = component.find(DatePickerComponent);

    expect(input.props().selected).toEqual(date);
  });
});
