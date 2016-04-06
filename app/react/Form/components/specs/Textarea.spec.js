import React from 'react';
import {shallow} from 'enzyme';

import Textarea from 'app/Form/components/Textarea';

describe('Textarea', () => {
  let component;
  let properties;
  let label;

  beforeEach(() => {
    properties = {prop: 'prop', prop2: 'prop2'};
    label = 'textarea label';

    component = shallow(<Textarea properties={properties} label={label}/>);
  });

  it('should render textarea with properties passed', () => {
    let textarea = component.find('textarea');

    expect(textarea.props().prop).toBe('prop');
    expect(textarea.props().prop2).toBe('prop2');
  });

  it('should render the label passed', () => {
    expect(component.find('label').text()).toBe('textarea label');
  });
});
