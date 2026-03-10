import { TriStateSelectValue } from 'app/istore';
import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { MultiSelectProps, MultiSelectState, MultiSelectTristate } from '../MultiSelect';

describe('MultiSelectTristate', () => {
  let component: ShallowWrapper<
    MultiSelectProps<TriStateSelectValue>,
    MultiSelectState,
    MultiSelectTristate
  >;
  let props: Partial<MultiSelectProps<TriStateSelectValue>>;

  beforeEach(() => {
    props = {
      value: { added: [], removed: [], originalFull: [], originalPartial: [] },
      options: [
        { label: 'Option1', value: 'option1', results: 5 },
        { label: 'Option2', value: 'option2', results: 4 },
        {
          label: 'Sub Group',
          value: 'Group',
          results: 3,
          options: [
            { label: 'Group option1', value: 'group-option1', results: 2 },
            { label: 'Group option2', value: 'group-option2', results: 1 },
          ],
        },
      ],
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<MultiSelectTristate {...props} />);
  };

  it('should render the checkboxes empty', () => {
    render();
    const optionElements = component.find('input[type="checkbox"]');
    expect(optionElements.length).toBe(5);
    expect(optionElements.at(0).props().value).toBe('option1');
    expect(optionElements.at(0).prop('data-state')).toBe(0);
    expect(optionElements.at(1).props().value).toBe('option2');
    expect(optionElements.at(1).prop('data-state')).toBe(0);
    expect(optionElements.at(2).props().value).toBe(undefined);
    expect(optionElements.at(2).prop('data-state')).toBe(0);
    expect(optionElements.at(3).props().value).toBe('group-option1');
    expect(optionElements.at(3).prop('data-state')).toBe(0);
    expect(optionElements.at(4).props().value).toBe('group-option2');
    expect(optionElements.at(4).prop('data-state')).toBe(0);
  });

  it('should render the with partial', () => {
    props.value = {
      added: ['option2'],
      removed: [],
      originalFull: ['group-option2'],
      originalPartial: ['group-option1'],
    };
    render();
    const optionElements = component.find('input[type="checkbox"]');
    expect(optionElements.length).toBe(5);
    // Option2 and Group are hoisted.
    expect(optionElements.at(0).props().value).toBe('option2');
    expect(optionElements.at(0).prop('data-state')).not.toBe(1);
    expect(optionElements.at(1).props().value).toBe(undefined);
    expect(optionElements.at(1).prop('data-state')).toBe(1);
    expect(optionElements.at(2).props().value).toBe('group-option1');
    expect(optionElements.at(2).prop('data-state')).toBe(1);
    expect(optionElements.at(3).props().value).toBe('group-option2');
    expect(optionElements.at(3).prop('data-state')).not.toBe(1);
    expect(optionElements.at(4).props().value).toBe('option1');
    expect(optionElements.at(4).prop('data-state')).not.toBe(1);
  });

  describe('when checking an option on empty state', () => {
    it('should call onChange with the new value', () => {
      props.value = { added: [], removed: [], originalFull: [], originalPartial: [] };
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['option1'],
        removed: [],
        originalFull: [],
        originalPartial: [],
      });
    });

    it('it should handle multiple options selected', () => {
      props.value = { added: ['option1'], removed: [], originalFull: [], originalPartial: [] };
      render();
      component.find('input[type="checkbox"]').at(1).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['option1', 'option2'],
        removed: [],
        originalFull: [],
        originalPartial: [],
      });
    });

    it('it should remove options that were selected', () => {
      props.value = {
        added: ['option1', 'option2'],
        removed: [],
        originalFull: [],
        originalPartial: [],
      };
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['option2'],
        removed: [],
        originalFull: [],
        originalPartial: [],
      });
    });
  });

  describe('when checking an option on partial state', () => {
    it('should call onChange with the new value', () => {
      props.value = {
        added: [],
        removed: [],
        originalFull: ['option1'],
        originalPartial: ['option2'],
      };
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: [],
        removed: ['option1'],
        originalFull: ['option1'],
        originalPartial: ['option2'],
      });
    });

    it('it should handle multiple options selected', () => {
      props.value = {
        added: ['option1'],
        removed: [],
        originalFull: ['option2'],
        originalPartial: ['group-option1'],
      };
      render();
      component.find('input[type="checkbox"]').at(1).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['option1'],
        removed: ['option2'],
        originalFull: ['option2'],
        originalPartial: ['group-option1'],
      });
    });

    it('it should toggle to partial on options that were remove', () => {
      props.value = {
        added: [],
        removed: ['option1'],
        originalFull: [],
        originalPartial: ['option1'],
      };
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: [],
        removed: [],
        originalFull: [],
        originalPartial: ['option1'],
      });
    });
    it('it should toggle to full on options that were partial', () => {
      props.value = {
        added: [],
        removed: [],
        originalFull: [],
        originalPartial: ['option1'],
      };
      render();
      component.find('input[type="checkbox"]').at(0).simulate('change');
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['option1'],
        removed: [],
        originalFull: [],
        originalPartial: ['option1'],
      });
    });
  });

  describe('when checking a group', () => {
    it('should modify all options of that group', () => {
      props.value = { added: [], removed: [], originalFull: [], originalPartial: [] };
      render();
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: true, dataset: { state: '0' } } });
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['group-option1', 'group-option2'],
        removed: [],
        originalFull: [],
        originalPartial: [],
      });
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: false, dataset: { state: '2' } } });
      expect(props.onChange).toHaveBeenCalledWith({
        added: [],
        removed: [],
        originalFull: [],
        originalPartial: [],
      });
    });
    it('should modify all options of that group, some selected', () => {
      props.value = {
        added: [],
        removed: [],
        originalFull: ['group-option1'],
        originalPartial: [],
      };
      render();
      expect(component.find('.group-checkbox').first().prop('data-state')).toBe(1);
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: true, dataset: { state: '1' } } });
      expect(props.onChange).toHaveBeenCalledWith({
        added: [],
        removed: ['group-option1'],
        originalFull: ['group-option1'],
        originalPartial: [],
      });
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: false, dataset: { state: '0' } } });
      expect(props.onChange).toHaveBeenCalledWith({
        added: ['group-option2'],
        removed: [],
        originalFull: ['group-option1'],
        originalPartial: [],
      });
    });
  });
});
