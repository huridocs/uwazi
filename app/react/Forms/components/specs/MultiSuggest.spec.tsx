/** @format */

import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { propertyTypes } from 'shared/propertyTypes';

import {
  MultiSuggestBase,
  MultiSuggestProps,
  acceptSuggestion,
  mapStateToProps,
} from '../MultiSuggest';

describe('MultiSelect', () => {
  let component: ShallowWrapper<typeof MultiSuggestBase>;
  let props: MultiSuggestProps;

  beforeEach(() => {
    props = {
      model: 'dummy',
      propertyType: propertyTypes.select,
      value: [{ value: 'B', label: 'Bl' }, { value: 'C', label: 'Cl' }, { value: '' }],
      selectModel: 'model.path',
      selectValue: ['A', 'B'],
      acceptSuggestion: jasmine.createSpy('acceptSuggestion'),
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    component = shallow(<MultiSuggestBase {...props} />);
  };

  it('should extrace selectValue correctly', () => {
    expect(mapStateToProps({ a: { b: { c: 'a' } } }, { selectModel: 'a.b.c' }).selectValue).toEqual(
      ['a']
    );
    expect(
      mapStateToProps({ a: { b: { c: ['a', 'b'] } } }, { selectModel: 'a.b.c' }).selectValue
    ).toEqual(['a', 'b']);
    expect(
      mapStateToProps({ entityView: { entityForm: { c: ['a', 'b'] } } }, { selectModel: '.c' })
        .selectValue
    ).toEqual(['a', 'b']);
  });

  it('should render the valid, not-already-accepted suggestions', () => {
    render();
    const optionElements = component.find('span[className="multiselectItem-name"]');
    expect(optionElements.length).toBe(1);
    expect(optionElements.at(0).props().children).toEqual(['Cl', '']);
  });

  it('should render the nothing if no suggestions', () => {
    props.selectValue = undefined;
    render();
    expect(component).toEqual({});
  });

  it('should reject clicked values', () => {
    render();
    component
      .find('div[className="multiselectItem-button"]')
      .at(0)
      .simulate('click', { preventDefault: () => {} });
    expect(props.onChange).toHaveBeenCalledWith([{ value: 'B', label: 'Bl' }, { value: '' }]);
  });

  it('should accept clicked values', () => {
    render();
    component
      .find('span[className="multiselectItem-name"]')
      .at(0)
      .simulate('click', { preventDefault: () => {} });
    expect(props.acceptSuggestion).toHaveBeenCalledWith('C', 'select', 'model.path', ['A', 'B']);
  });

  it('should store accepted suggestion correctly', () => {
    const dispatch = jasmine.createSpy('dispatch');
    acceptSuggestion('C', propertyTypes.multiselect, 'a.b.c', ['B'])(dispatch);
    expect(dispatch.calls.argsFor(0)[0].value).toEqual(['B', 'C']);
    acceptSuggestion('C', propertyTypes.multiselect, 'a.b.c', [])(dispatch);
    expect(dispatch.calls.argsFor(1)[0].value).toEqual(['C']);
    acceptSuggestion('C', propertyTypes.select, 'a.b.c', ['B'])(dispatch);
    expect(dispatch.calls.argsFor(2)[0].value).toEqual('C');
    acceptSuggestion('C', propertyTypes.select, 'a.b.c', [])(dispatch);
    expect(dispatch.calls.argsFor(3)[0].value).toEqual('C');
    acceptSuggestion('C', propertyTypes.multiselect, 'a.b.c', ['C'])(dispatch);
    acceptSuggestion('C', propertyTypes.select, 'a.b.c', ['C'])(dispatch);
    expect(dispatch.calls.count()).toEqual(4);
  });
});
