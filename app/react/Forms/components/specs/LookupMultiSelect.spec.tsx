import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { sleep } from 'shared/tsUtils';
import {
  LookupMultiSelect,
  LookupMultiSelectProps,
  LookupMultiSelectState,
  debounceTime,
} from '../LookupMultiSelect';

import { MultiSelect, MultiSelectProps } from '../MultiSelect';

describe('LookupMultiSelect', () => {
  let component: ShallowWrapper<LookupMultiSelectProps, LookupMultiSelectState, LookupMultiSelect>;
  let props: Partial<LookupMultiSelectProps>;

  beforeEach(() => {
    props = {
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
    };
  });

  const render = (lookupOverride?: any) => {
    const lookup =
      lookupOverride ||
      (async () => ({
        options: [
          { label: 'new', value: 'new', results: 1 },
          { label: 'new 2', value: 'new 2', results: 2 },
        ],
        count: 2,
      }));

    component = shallow(<LookupMultiSelect {...props} lookup={lookup} />);
  };

  const getProps = () => component.find(MultiSelect).props() as MultiSelectProps<string[]>;

  describe('onFilter', () => {
    it('should lookup and render multiselect with new found options when searchTerm is not empty', async () => {
      render();
      await getProps().onFilter('test');
      await sleep(debounceTime + 1);

      component.update();
      expect(getProps().options).toEqual(
        props.options!.concat([
          { label: 'new', value: 'new', results: 1 },
          { label: 'new 2', value: 'new 2', results: 2 },
        ])
      );
    });
  });

  describe('onChange', () => {
    it('options should also include selectedOptions', () => {
      render();

      component.setState({ lookupOptions: [{ label: 'new', value: 'new', results: 1 }] });
      getProps().onChange(['option2']);
      component.setProps({ options: [] });

      expect(getProps().options).toEqual([
        { label: 'new', value: 'new', results: 1 },
        { label: 'Option2', value: 'option2', results: 4 },
      ]);
    });
  });

  describe('component update props', () => {
    it('should update the totalPossibleOptions in the state', () => {
      render();

      component.setState({ totalPossibleOptions: 10 });
      component.setProps({ totalPossibleOptions: 42 });

      expect(component.state().totalPossibleOptions).toBe(42);
    });
  });

  describe('lifecycle on mount and lookup prop change', () => {
    it('should call onFilter (lookup) on mount', async () => {
      const lookupSpy = jasmine.createSpy('lookup').and.returnValue(
        Promise.resolve({
          options: [{ label: 'mount', value: 'mount', results: 1 }],
          count: 1,
        })
      );
      render(lookupSpy);
      // Wait for debounce and async
      await sleep(debounceTime + 1);
      component.update();
      expect(lookupSpy).toHaveBeenCalledWith('');
    });

    it('should call onFilter (lookup) when lookup prop changes', async () => {
      const firstLookup = jasmine.createSpy('lookup1').and.returnValue(
        Promise.resolve({
          options: [{ label: 'first', value: 'first', results: 1 }],
          count: 1,
        })
      );
      render(firstLookup);
      await sleep(debounceTime + 1);
      component.update();
      expect(firstLookup).toHaveBeenCalledWith('');

      const secondLookup = jasmine.createSpy('lookup2').and.returnValue(
        Promise.resolve({
          options: [{ label: 'second', value: 'second', results: 1 }],
          count: 1,
        })
      );
      component.setProps({ lookup: secondLookup });
      await sleep(debounceTime + 1);
      component.update();
      expect(secondLookup).toHaveBeenCalledWith('');
    });
  });
});
