import React from 'react';
import {shallow} from 'enzyme';

import Select from 'app/Form/components/Select';

describe('Select', () => {
  let component;
  let properties;
  let label;
  let options;

  beforeEach(() => {
    properties = {prop: 'prop', prop2: 'prop2'};
    label = 'input label';
    options = [{label: 'Option1', value: 'option1'}, {label: 'Option2', value: 'option2'}];

    component = shallow(<Select properties={properties} label={label} options={options}/>);
  });

  it('should render input with properties passed', () => {
    let select = component.find('select');

    expect(select.props().prop).toBe('prop');
    expect(select.props().prop2).toBe('prop2');
  });

  it('should render the label passed', () => {
    expect(component.find('label').text()).toBe('input label');
  });

  it('should render the options', () => {
    let optionElements = component.find('option');

    expect(optionElements.length).toBe(2);
    expect(optionElements.first().props().value).toBe('option1');
    expect(optionElements.first().text()).toBe('Option1');
    expect(optionElements.last().props().value).toBe('option2');
    expect(optionElements.last().text()).toBe('Option2');
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      options = [{name: 'Option1', id: 'option1'}, {name: 'Option2', id: 'option2'}];
      component = shallow(<Select label='special select' options={options} optionsValue="id" optionsLabel="name"/>);
    });

    it('should render the options', () => {
      let optionElements = component.find('option');

      expect(optionElements.length).toBe(2);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.first().text()).toBe('Option1');
      expect(optionElements.last().props().value).toBe('option2');
      expect(optionElements.last().text()).toBe('Option2');
    });
  });
});
