import React from 'react';
import {shallow} from 'enzyme';

import {FormGroup} from '../FormGroup';
import {Field, Control} from 'react-redux-form';

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      model: 'username'
    };
  });

  let render = () => {
    component = shallow(<FormGroup {...props}><label>label</label><Field><input /></Field></FormGroup>);
  };

  it('should render render children', () => {
    props.hasError = true;
    render();
    let control = component.find(Control.custom);
    expect(control.props().model).toBe(props.model);
  });

  describe('mapProps className', () => {
    let mapProps;
    beforeEach(() => {
      render();
      let control = component.find(Control.custom);
      mapProps = control.props().mapProps;
    });

    it('should be has-error class when not pristine and invalid', () => {
      let ownProps = {fieldValue: {pristine: false, valid: false}};
      expect(mapProps.className(ownProps)).toBe('has-error');

      ownProps = {fieldValue: {$form: {pristine: false, valid: false}}};
      expect(mapProps.className(ownProps)).toBe('has-error');
    });

    it('should be has-error class when pristine but submitFailed and invalid', () => {
      let ownProps = {fieldValue: {pristine: true, valid: false, submitFailed: true}};
      expect(mapProps.className(ownProps)).toBe('has-error');

      ownProps = {fieldValue: {$form: {pristine: true, valid: false, submitFailed: true}}};
      expect(mapProps.className(ownProps)).toBe('has-error');
    });

    it('should be an empty string when valid', () => {
      let ownProps = {fieldValue: {valid: true}};
      expect(mapProps.className(ownProps)).toBe('');

      ownProps = {fieldValue: {$form: {valid: true}}};
      expect(mapProps.className(ownProps)).toBe('');
    });

    it('should be an empty string when invalid but pristine', () => {
      let ownProps = {fieldValue: {valid: false, pristine: true, submitFailed: false}};
      expect(mapProps.className(ownProps)).toBe('');
    });
  });
});
