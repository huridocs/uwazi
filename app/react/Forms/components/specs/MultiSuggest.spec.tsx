/** @format */

import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { MultiSuggestBase, MultiSuggestProps } from '../MultiSuggest';

describe('MultiSelect', () => {
  let component: ShallowWrapper<typeof MultiSuggestBase>;
  let props: MultiSuggestProps;

  beforeEach(() => {
    props = {
      propertyType: 'select',
      value: [{ value: 'B', label: 'Bl' }, { value: 'C', label: 'Cl' }, { value: '' }],
      selectModel: 'model.path',
      selectValue: ['A', 'B'],
      onChange: jasmine.createSpy('onChange'),
      acceptSuggestion: jasmine.createSpy('acceptSuggestion'),
    };
  });

  const render = () => {
    component = shallow(<MultiSuggestBase {...props} />);
  };

  it('should render the valid, not-already-accepted suggestions', () => {
    render();
    const optionElements = component.find('span[className="multiselectItem-name"]');
    expect(optionElements.length).toBe(1);
    expect(optionElements.at(0).props().children).toEqual(['Cl', '']);
  });

  it('should accept clicked values', () => {
    render();
    component
      .find('span[className="multiselectItem-name"]')
      .at(0)
      .simulate('click', { preventDefault: () => {} });
    expect(props.acceptSuggestion).toHaveBeenCalledWith('C', 'select', 'model.path', ['A', 'B']);
  });
});
