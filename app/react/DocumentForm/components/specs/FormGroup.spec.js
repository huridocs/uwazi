import React from 'react';
import {shallow} from 'enzyme';

import FormGroup from 'app/DocumentForm/components/FormGroup';

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  let render = () => {
    component = shallow(<FormGroup {...props}/>);
  };

  it('should render errors when touched and invalid', () => {
    props.pristine = false;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.pristine = false;
    props.submitFailed = true;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should not render errors when not touched', () => {
    props.pristine = true;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });

  it('should not render errors when submitFailed with no errors', () => {
    props.submitFailed = true;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(false);
  });
});
