import React from 'react';
import { shallow } from 'enzyme';

import Select from '../Select';

describe('Select', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      options: [{ label: 'Option1', value: 'option1' }, { label: 'Option2', value: 'option2' }],
      onChange: () => {}
    };
  });

  const render = () => {
    component = shallow(<Select {...props}/>);
  };

  it('should render select with properties passed', () => {
    props.value = 'test';
    render();
    const select = component.find('select');

    expect(select.props().value).toBe('test');
  });

  it('should render the options', () => {
    render();
    const optionElements = component.find('option');

    expect(optionElements.length).toBe(3);
    expect(optionElements.at(1).props().value).toBe('option1');
    expect(optionElements.at(1).text()).toBe('Option1');
    expect(optionElements.last().props().value).toBe('option2');
    expect(optionElements.last().text()).toBe('Option2');
  });

  it('should sort the options alphabetically', () => {
    props.options.push({ label: 'An option', value: 'option3' });
    render();
    const optionElements = component.find('option');

    expect(optionElements.length).toBe(4);
    expect(optionElements.at(1).props().value).toBe('option3');
    expect(optionElements.at(1).text()).toBe('An option');
    expect(optionElements.last().props().value).toBe('option2');
    expect(optionElements.last().text()).toBe('Option2');
  });

  describe('when passing placeholder', () => {
    it('should render a blank label opton with blank value', () => {
      props.placeholder = 'blank';
      render();

      const optionElements = component.find('option');
      expect(optionElements.length).toBe(3);
      expect(optionElements.first().props().value).toBe('');
      expect(optionElements.first().text()).toBe('blank');
    });
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        options: [{ name: 'Option1', id: 'option1' }, { name: 'Option2', id: 'option2' }, { name: 'An Option', id: 'option3' }],
        optionsValue: 'id',
        optionsLabel: 'name',
        onChange: () => {}
      };
      component = shallow(<Select {...props}/>);
    });

    it('should render the options', () => {
      const optionElements = component.find('option');

      expect(optionElements.length).toBe(4);
      expect(optionElements.at(1).props().value).toBe('option3');
      expect(optionElements.at(1).text()).toBe('An Option');
      expect(optionElements.at(2).props().value).toBe('option1');
      expect(optionElements.at(2).text()).toBe('Option1');
      expect(optionElements.at(3).props().value).toBe('option2');
      expect(optionElements.at(3).text()).toBe('Option2');
    });
  });

  describe('when passing group of options', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        options: [
          { label: 'Option group 1', options: [{ name: 'opt 1', id: 1 }, { name: 'opt 1', id: 4 }] },
          { label: 'An option group', options: [{ name: 'opt 3', id: 3 }, { name: 'opt 4', id: 4 }] }
        ],
        optionsValue: 'id',
        optionsLabel: 'name',
        onChange: () => {}
      };
      component = shallow(<Select {...props}/>);
    });

    it('should render the option groups', () => {
      const optionGroups = component.find('optgroup');
      const optionElements = component.find('option');

      expect(optionGroups.length).toBe(2);
      expect(optionGroups.first().props().label).toBe('Option group 1');
      expect(optionGroups.last().props().label).toBe('An option group');
      expect(optionElements.at(3).text()).toBe('opt 3');
    });

    it('should render the inner options alphabetically (but not the groups)', () => {
      props.options = [
        { label: 'Option group 1', options: [{ label: 'opt 1', id: 1 }, { label: 'opt 1', id: 4 }] },
        { label: 'An option group', options: [{ label: 'opt 3', id: 3 }, { label: 'opt 4', id: 4 }, { label: 'An Option', id: 5 }] }
      ];
      props.optionsLabel = 'label';

      component = shallow(<Select {...props}/>);
      const optionGroups = component.find('optgroup');
      const optionElements = component.find('option');

      expect(optionGroups.first().props().label).toBe('Option group 1');
      expect(optionElements.at(3).text()).toBe('An Option');
    });
  });
});
