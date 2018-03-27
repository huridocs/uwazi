import React from 'react';
import { shallow } from 'enzyme';

import MultiSelect from '../MultiSelect';

describe('MultiSelect', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [],
      options: [
        { label: 'Option1', value: 'option1', results: 4 },
        { label: 'Option2', value: 'option2', results: 2 }
      ],
      onChange: jasmine.createSpy('onChange')
    };
  });

  const render = () => {
    component = shallow(<MultiSelect {...props}/>);
  };

  it('should render the checkboxes', () => {
    render();
    const optionElements = component.find('input[type="checkbox"]');

    expect(optionElements.length).toBe(2);
    expect(optionElements.first().props().value).toBe('option1');
    expect(optionElements.last().props().value).toBe('option2');
  });

  describe('when checking an option', () => {
    it('should call onChange with the new value', () => {
      render();
      component.find('input[type="checkbox"]').first().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1']);
    });

    it('it should handle multiple options selected', () => {
      props.value = ['option1'];
      render();
      component.find('input[type="checkbox"]').last().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('it should remove options that were selected', () => {
      props.value = ['option1'];
      render();
      component.find('input[type="checkbox"]').first().simulate('change');
      expect(props.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('filtering', () => {
    it('should render only options matching the filter', () => {
      render();
      component.setState({ filter: '1' });
      const optionElements = component.find('input[type="checkbox"]');
      expect(optionElements.length).toBe(1);
      expect(optionElements.first().props().value).toBe('option1');
    });
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: [],
        options: [
          { name: 'Option1', id: 'option1', results: 4 },
          { name: 'Option3', id: 'option3', results: 2 },
          { name: 'Option2', id: 'option2', results: 2 }
        ],
        optionsValue: 'id',
        optionsLabel: 'name'
      };
      component = shallow(<MultiSelect {...props}/>);
    });

    it('should render the options by results and then by label', () => {
      const optionElements = component.find('input[type="checkbox"]');

      expect(optionElements.length).toBe(3);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.last().props().value).toBe('option3');
    });
  });
});
