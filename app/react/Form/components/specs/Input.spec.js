import React from 'react';
import {shallow} from 'enzyme';

import Input from 'app/Form/components/Input';

describe('Input', () => {
  let component;
  let properties;
  let label;

  beforeEach(() => {
    properties = {prop: 'prop', prop2: 'prop2'};
    label = 'input label';

    component = shallow(<Input properties={properties} label={label}/>);
  });

  it('should render input with properties passed', () => {
    let input = component.find('input');

    expect(input.props().prop).toBe('prop');
    expect(input.props().prop2).toBe('prop2');
  });

  it('should render the label passed', () => {
    expect(component.find('label').text()).toBe('input label');
  });
});
