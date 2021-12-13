/** @format */

import React from 'react';
import { shallow } from 'enzyme';

import DateRange from '../DateRange';
import DatePicker from '../DatePicker';

describe('DateRange', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<DateRange {...props} />);
  };

  beforeEach(() => {
    props = {
      onChange: jasmine.createSpy('onChange'),
      value: { from: 0, to: 1 },
    };

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
      component.find(DatePicker).first().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({ from: 1469656800, to: 1 });
      // We're mocking out onChange, so the change is not persisted.
      component.find(DatePicker).last().simulate('change', 1469656800);
      expect(props.onChange).toHaveBeenCalledWith({ from: 0, to: 1469656800 });
    });
  });
});
