import React from 'react';
import {shallow} from 'enzyme';

import FormGroup from '../FormGroup';
import FormField from '../FormField';

fdescribe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  let render = () => {
    component = shallow(<FormGroup {...props}><label>label</label><FormField><input /></FormField></FormGroup>);
  };

  it('should render the label in the first li', () => {
    render();
    let label = component.find('li').first().find('label');
    expect(label.length).toBe(1);
  });

  it('should render the FormField in the second li', () => {
    render();
    let field = component.find('li').last().find(FormField);
    expect(field.length).toBe(1);
  });

  it('should render errors when touched and invalid', () => {
    props.touched = true;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.touched = false;
    props.submitFailed = true;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should not render errors when submitFailed with no errors', () => {
    props.submitFailed = true;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });
});
