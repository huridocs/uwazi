import React from 'react';
import {shallow} from 'enzyme';

import Textarea from 'app/Form/components/Textarea';

describe('Textarea', () => {
  let component;
  let label;

  let render = (properties = {prop: 'prop', prop2: 'prop2'}) => {
    label = 'textarea label';
    component = shallow(<Textarea properties={properties} label={label}/>);
  };

  it('should render textarea with properties passed', () => {
    render();
    let textarea = component.find('textarea');

    expect(textarea.props().prop).toBe('prop');
    expect(textarea.props().prop2).toBe('prop2');
  });

  it('should render the label passed', () => {
    render();
    expect(component.find('label').text()).toBe('textarea label');
  });

  it('should show error if field is touched and has errors', () => {
    render();
    expect(component.find('.has-error').length).toBe(0);
    render({touched: true, error: 'error'});
    expect(component.find('.has-error').length).toBe(1);
  });
});
