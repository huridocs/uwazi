/** @format */

import React from 'react';
import { shallow } from 'enzyme';

import MultiDate from '../MultiDate';
import DatePicker from '../DatePicker';

describe('MultiDate', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [1473984000, 1474070400, 1474156800],
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<MultiDate {...props} />);
  };

  it('should render a DatePicker for each value', () => {
    render();
    const datepickers = component.find(DatePicker);
    expect(datepickers.length).toBe(3);
  });

  describe('changing a datepicker', () => {
    it('should call onChange with the new array of values', () => {
      render();
      const datepickers = component.find(DatePicker);
      datepickers.first().simulate('change', 1234);
      expect(props.onChange).toHaveBeenCalledWith([1234, 1474070400, 1474156800]);
    });
  });

  describe('adding a date', () => {
    it('should add a value to the state', () => {
      render();
      const addButton = component.find('.btn-success');
      addButton.simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([1473984000, 1474070400, 1474156800, null]);
    });
  });

  describe('removing a date', () => {
    it('should remove the value from the state', () => {
      render();
      const removeButtons = component.find('.react-datepicker__delete-icon');
      removeButtons.first().simulate('click', { preventDefault: () => {} });
      expect(component.state().values).toEqual([1474070400, 1474156800]);
      expect(props.onChange).toHaveBeenCalledWith([1474070400, 1474156800]);
    });
  });
});
