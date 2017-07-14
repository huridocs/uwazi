import React from 'react';
import {shallow} from 'enzyme';

import RadioButtons from '../RadioButtons';

describe('RadioButtons', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [],
      options: [{label: 'Option1', value: 'option1'}, {label: 'Option2', value: 'option2'}],
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<RadioButtons {...props}/>);
  };

  it('should render the radio buttons', () => {
    render();
    let optionElements = component.find('input[type="radio"]');

    expect(optionElements.length).toBe(2);
    expect(optionElements.first().props().value).toBe('option1');
    expect(optionElements.last().props().value).toBe('option2');
  });

  describe('when clicking an option', () => {
    it('should call onChange with the new value', () => {
      render();
      component.find('input[type="radio"]').first().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith('option1');
      component.find('input[type="radio"]').last().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: [],
        options: [{name: 'Option1', id: 'option1'}, {name: 'Option2', id: 'option2'}],
        optionsValue: 'id',
        optionsLabel: 'name'
      };
      component = shallow(<RadioButtons {...props}/>);
    });

    it('should render the options', () => {
      let optionElements = component.find('input[type="radio"]');

      expect(optionElements.length).toBe(2);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.last().props().value).toBe('option2');
    });
  });
});
