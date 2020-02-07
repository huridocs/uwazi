import React from 'react';
import { shallow } from 'enzyme';

import { Field } from 'react-redux-form';
import FormGroup from '../FormGroup';

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = shallow(
      <FormGroup {...props}>
        <label>label</label>
        <Field>
          <input />
        </Field>
      </FormGroup>
    );
  };

  it('should render the children', () => {
    render();
    const label = component.find('label');
    expect(label.length).toBe(1);
    const field = component.find(Field);
    expect(field.length).toBe(1);
  });

  it('should render errors when touched and invalid', () => {
    props.touched = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.touched = false;
    props.submitFailed = true;
    props.valid = false;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should not render errors when submitFailed with no errors', () => {
    props.submitFailed = true;
    render();
    const group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });
});
