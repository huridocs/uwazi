import React from 'react';
import {shallow} from 'enzyme';

import Input from 'app/Form/components/Input';

describe('Input', () => {
  let component;
  let label;

  let render = (properties = {prop: 'prop', prop2: 'prop2'}) => {
    label = 'input label';
    component = shallow(<Input properties={properties} label={label}/>);
  };

  it('should render input with properties passed', () => {
    render();
    let input = component.find('input');

    expect(input.props().prop).toBe('prop');
    expect(input.props().prop2).toBe('prop2');
  });
});
