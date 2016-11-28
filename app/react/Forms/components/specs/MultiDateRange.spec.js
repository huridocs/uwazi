import React from 'react';
import {shallow} from 'enzyme';

import MultiDateRange from '../MultiDateRange';
import DatePicker from '../DatePicker';

describe('MultiDateRange', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [{from: '1473984000', to: '1473984001'}, {from: '1474156800', to: '1474156801'}],
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<MultiDateRange {...props}/>);
  };

  it('should render a pair of DatePickers for each value', () => {
    render();
    let datepickers = component.find(DatePicker);
    expect(datepickers.length).toBe(4);
  });

  describe('changing a datepicker', () => {
    it('should call onChange with the new array of values', () => {
      render();
      let datepickers = component.find(DatePicker);
      datepickers.first().simulate('change', 'new date');
      expect(props.onChange).toHaveBeenCalledWith([{from: 'new date', to: '1473984001'}, {from: '1474156800', to: '1474156801'}]);
    });
  });

  describe('adding a date', () => {
    it('should add a value to the state', () => {
      render();
      let addButton = component.find('.btn-success');
      addButton.simulate('click', {preventDefault: () =>{}});
      expect(component.state().values).toEqual([
        {from: '1473984000', to: '1473984001'},
        {from: '1474156800', to: '1474156801'},
        {from: null, to: null}
      ]);
    });
  });

  describe('removing a date', () => {
    it('should remove the value from the state', () => {
      render();
      let removeButtons = component.find('.react-datepicker__close-icon');
      removeButtons.first().simulate('click', {preventDefault: () =>{}});
      expect(component.state().values).toEqual([{from: '1474156800', to: '1474156801'}]);
      expect(props.onChange).toHaveBeenCalledWith([{from: '1474156800', to: '1474156801'}]);
    });
  });
});
