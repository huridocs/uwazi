import React from 'react';
import { shallow } from 'enzyme';

import MultiSelect from '../MultiSelect';

describe('MultiSelect', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [],
      options: [
        { label: 'Option1', value: 'option1', results: 4 },
        { label: 'Option2', value: 'option2', results: 2 },
        { label: 'Group',
          value: 'Group',
          results: 3,
          options: [
            { label: 'Group option1', value: 'group-option1', results: 2 },
            { label: 'Group option2', value: 'group-option2', results: 1 }
          ]
        }
      ],
      onChange: jasmine.createSpy('onChange')
    };
  });

  const render = () => {
    component = shallow(<MultiSelect {...props}/>);
    instance = component.instance();
  };

  it('should render the checkboxes', () => {
    render();
    const optionElements = component.find('input[type="checkbox"]');
    expect(optionElements.length).toBe(5);
    expect(optionElements.at(3).props().value).toBe('option1');
    expect(optionElements.at(4).props().value).toBe('option2');
  });

  describe('when checking an option', () => {
    it('should call onChange with the new value', () => {
      render();
      component.find('input[type="checkbox"]').at(3).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1']);
    });

    it('it should handle multiple options selected', () => {
      props.value = ['option1'];
      render();
      component.find('input[type="checkbox"]').at(4).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('it should remove options that were selected', () => {
      props.value = ['option1'];
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('checking a group', () => {
    it('should modify all options of that group', () => {
      render();
      component.find('.group-checkbox').first().simulate('change', { target: { checked: true } });
      expect(props.onChange).toHaveBeenCalledWith(['group-option1', 'group-option2']);
      component.find('.group-checkbox').first().simulate('change', { target: { checked: false } });
      expect(props.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('toggleOptions', () => {
    it('should togle a flag in the state to show or not group sub options', () => {
      component.find('.multiselect-group .multiselectItem-action').first().simulate('click', { preventDefault: () => {} });
      expect(component.state().ui).toEqual({ Group: true });
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
        optionsLabel: 'name',
        onChange: jasmine.createSpy('onChange')
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

  describe('filter()', () => {
    it('should set the input value filter', () => {
      instance.filter({ target: { value: 'something' } });
      expect(instance.state.filter).toBe('something');
    });
  });

  describe('resetFilter()', () => {
    it('should reset the filter', () => {
      instance.resetFilter();
      expect(instance.state.filter).toBe('');
    });
  });

  describe('componentWillReceiveProps()', () => {
    it('should set the filter in the state', () => {
      instance.componentWillReceiveProps({ filter: 'Only this' });
      expect(instance.state.filter).toBe('Only this');
    });
  });

  describe('showAll()', () => {
    it('should toggle state flag showAll', () => {
      instance.showAll({ preventDefault: () => {} });
      expect(instance.state.showAll).toBe(true);

      instance.showAll({ preventDefault: () => {} });
      expect(instance.state.showAll).toBe(false);
    });
  });
});
