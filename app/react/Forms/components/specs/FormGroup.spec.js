import React from 'react';
import {shallow} from 'enzyme';

import {FormGroup, mapStateToProps} from '../FormGroup';
import {Field} from 'react-redux-form';

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  let render = () => {
    component = shallow(<FormGroup {...props}><label>label</label><Field><input /></Field></FormGroup>);
  };

  it('should render errors when hasErrors', () => {
    props.hasError = true;
    render();
    let group = component.find('.form-group');
    expect(group.hasClass('has-error')).toBe(true);
  });

  describe('mapStateToProps', () => {
    it('should return hasError true when touched and invalid', () => {
      expect(mapStateToProps({}, {touched: true, valid: false})).toEqual({hasError: true});
    });

    it('should return hasError true when submitFailed and valid false', () => {
      expect(mapStateToProps({}, {submitFailed: true, valid: false})).toEqual({hasError: true});
    });

    it('should return hasError false when submitFailed with no errors', () => {
      expect(mapStateToProps({}, {submitFailed: true})).toEqual({hasError: false});
    });
  });
});
