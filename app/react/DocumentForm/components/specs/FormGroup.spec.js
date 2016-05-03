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
    props.touched = true;
    props.valid = false;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  it('should render errors when touched and submitFailed', () => {
    props.touched = false;
    props.submitFailed = true;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });
});
