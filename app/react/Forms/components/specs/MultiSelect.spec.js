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
      onFilter: jasmine.createSpy('onFilter').and.returnValue(Promise.resolve()),
    };
  });

  const render = () => {
    component = shallow(<MultiSelect {...props} />);
    instance = component.instance();
  };

  it('should render the checkboxes empty', () => {
    render();
    const optionElements = component.find('input[type="checkbox"]');
    expect(optionElements.length).toBe(5);
    expect(optionElements.at(0).props().value).toBe('option1');
    expect(optionElements.at(0).hasClass('partial')).toBe(false);
    expect(optionElements.at(1).props().value).toBe('option2');
    expect(optionElements.at(1).hasClass('partial')).toBe(false);
    expect(optionElements.at(2).props().value).toBe(undefined);
    expect(optionElements.at(2).hasClass('partial')).toBe(false);
    expect(optionElements.at(3).props().value).toBe('group-option1');
    expect(optionElements.at(3).hasClass('partial')).toBe(false);
    expect(optionElements.at(4).props().value).toBe('group-option2');
    expect(optionElements.at(4).hasClass('partial')).toBe(false);
  });

  it('should render the checkboxes partial group', () => {
    props.value = ['group-option2'];
    render();
    const optionElements = component.find('input[type="checkbox"]');
    expect(optionElements.length).toBe(5);
    // Group is hoisted.
    expect(optionElements.at(0).props().value).toBe(undefined);
    expect(optionElements.at(0).hasClass('partial')).toBe(true);
    expect(optionElements.at(1).props().value).toBe('group-option1');
    expect(optionElements.at(1).hasClass('partial')).toBe(false);
    expect(optionElements.at(2).props().value).toBe('group-option2');
    expect(optionElements.at(2).hasClass('partial')).toBe(false);
    expect(optionElements.at(3).props().value).toBe('option1');
    expect(optionElements.at(3).hasClass('partial')).toBe(false);
    expect(optionElements.at(4).props().value).toBe('option2');
    expect(optionElements.at(4).hasClass('partial')).toBe(false);
  });

  it('should not render aggregations on the groups when not defined', () => {
    delete props.options[2].results;
    render();
    const groupAggregation = component.find(
      '.multiselect-group .multiselectItem .multiselectItem-results'
    );
    expect(groupAggregation.at(0)).toMatchSnapshot();
  });

  it('should display a not found message when there are no options', () => {
    props.options = [];
    props.sourceName = 'My List';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should not render an empty group', () => {
    props.options.push({ label: 'Empty Group', value: 'empty', options: [] });
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when checking an option', () => {
    it('should call onChange with the new value', () => {
      render();
      component
        .find('input[type="checkbox"]')
        .at(0)
        .simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1']);
    });

    it('it should handle multiple options selected', () => {
      props.value = ['option1'];
      render();
      component
        .find('input[type="checkbox"]')
        .at(1)
        .simulate('change');
      expect(props.onChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('it should remove options that were selected', () => {
      props.value = ['option1'];
      render();
      component
        .find('input[type="checkbox"]')
        .at(0)
        .simulate('change');
      expect(props.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('checking a group', () => {
    it('should modify all options of that group', () => {
      render();
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: true } });
      expect(props.onChange).toHaveBeenCalledWith(['group-option1', 'group-option2']);
      component
        .find('.group-checkbox')
        .first()
        .simulate('change', { target: { checked: false } });
      expect(props.onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('toggleOptions', () => {
    it('should toggle a flag in the state to show or not group sub options', () => {
      render();
      component
        .find('.multiselectItem-action')
        .first()
        .simulate('click', { preventDefault: () => {} });
      expect(component.state().ui).toEqual({ Group: true });
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: [],
        options: [
          { label: 'Option1', value: 'option1', results: 5 },
          { label: 'Option2', value: 'option2', results: 4 },
          {
            label: 'Sub Group',
            value: 'Group',
            results: 3,
            options: [
              { label: 'Group option', value: 'group-option1', results: 2 },
              { label: 'Group option2', value: 'group-option2', results: 1 },
            ],
          },
        ],
        onChange: jasmine.createSpy('onChange'),
      };
    });
    it('should render only options matching the filter', () => {
      render();
      component.setState({ filter: '1' });
      const optionElements = component.find('input[type="checkbox"]');
      expect(optionElements.length).toBe(1);
      expect(optionElements.first().props().value).toBe('option1');
    });
    it('should render group if children match filter', () => {
      render();
      component.setState({ filter: '2' });
      const optionElements = component.find('input[type="checkbox"]');
      expect(optionElements.length).toBe(4);
      expect(optionElements.first().props().value).toBe('option2');
      expect(optionElements.at(2).props().value).toBe('group-option1');
      expect(optionElements.at(3).props().value).toBe('group-option2');
    });
  });

  describe('different key name for label and value', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: [],
        options: [
          { name: 'Option1', id: 'option1', results: 4 },
          { name: 'Option3', id: 'option3', results: 3 },
          { name: 'Option2', id: 'option2', results: 2 },
        ],
        optionsValue: 'id',
        optionsLabel: 'name',
        onChange: jasmine.createSpy('onChange'),
      };
    });

    it('should render the options', () => {
      render();
      const optionElements = component.find('input[type="checkbox"]');

      expect(optionElements.length).toBe(3);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.last().props().value).toBe('option2');
    });

    it('should render the options by the result and then label if list is sorted', () => {
      props.sort = true;
      render();
      const optionElements = component.find('input[type="checkbox"]');

      expect(optionElements.length).toBe(3);
      expect(optionElements.first().props().value).toBe('option1');
      expect(optionElements.last().props().value).toBe('option3');
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      props = {
        label: 'input label',
        value: [],
        options: [
          { label: 'D', value: 'option1', results: 2 },
          { label: 'A', value: 'option2', results: 1 },
          { label: 'C', value: 'option3', results: 4 },
        ],
        onChange: jasmine.createSpy('onChange'),
      };
    });
    describe('when prop.sort is false', () => {
      it('should sort by descending aggregated results count', () => {
        render();
        const options = component.find('input[type="checkbox"]');
        expect(options.length).toBe(3);
        expect(options.first().props().value).toBe('option3');
        expect(options.last().props().value).toBe('option2');
      });
      it('should use alphabetical order as tie breaker if items have the same count', () => {
        props.options[0].results = 4;
        props.options.push({ label: 'B', value: 'option4', results: 1 });
        render();
        const options = component.find('input[type="checkbox"]');
        expect(options.length).toBe(4);
        expect(options.first().props().value).toBe('option3');
        expect(options.at(1).props().value).toBe('option1');
        expect(options.at(2).props().value).toBe('option2');
        expect(options.last().props().value).toBe('option4');
      });
      it('should not sort if options do not have aggregate results', () => {
        props.options = [
          { label: 'D', value: 'option1' },
          { label: 'A', value: 'option2' },
          { label: 'C', value: 'option3' },
        ];
        render();
        const options = component.find('input[type="checkbox"]');
        expect(options.length).toBe(3);
        expect(options.first().props().value).toBe('option1');
        expect(options.at(1).props().value).toBe('option2');
        expect(options.last().props().value).toBe('option3');
      });
    });

    describe('when prop.sort is true', () => {
      it('should sort by alphabetical order', () => {
        props.sort = true;
        render();
        const options = component.find('input[type="checkbox"]');
        expect(options.length).toBe(3);
        expect(options.first().props().value).toBe('option2');
        expect(options.at(1).props().value).toBe('option3');
        expect(options.last().props().value).toBe('option1');
      });
      it('should sort by descending results if not showing all options', () => {
        props.showAll = false;
        props.optionsToShow = 2;

        render();
        const options = component.find('input[type="checkbox"]');
        expect(options.length).toBe(2);
        expect(options.first().props().value).toBe('option3');
        expect(options.at(1).props().value).toBe('option1');
      });
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
      render();
      instance.resetFilter();
      expect(instance.state.filter).toBe('');
      expect(props.onFilter).toHaveBeenCalledWith('');
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
