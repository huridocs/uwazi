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
    it('should map pristine', () => {
      let state = {namespace: {$form: {model: 'namespace'}, field: {pristine: false}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).touched).toEqual(true);

      state = {namespace: {$form: {model: 'namespace'}, field: {$form: {pristine: false}}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).touched).toEqual(true);

      state = {namespace: {$form: {model: 'namespace'}, field: {pristine: true}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).touched).toEqual(false);

      state = {namespace: {$form: {model: 'namespace'}, field: {$form: {pristine: true}}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).touched).toEqual(false);
    });

    it('should return hasError true when pristine and invalid', () => {
      let state = {namespace: {$form: {model: 'namespace'}, field: {pristine: false, valid: false}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);

      state = {namespace: {$form: {model: 'namespace'}, field: {$form: {pristine: false, valid: false}}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);
    });

    it('should return hasError true when submitFailed and valid false and has not been touched', () => {
      let state = {namespace: {$form: {model: 'namespace'}, field: {submitFailed: true, valid: false, pristine: true}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);
    });

    it('should return hasError false when submitFailed with no errors', () => {
      let state = {namespace: {$form: {model: 'namespace'}, field: {submitFailed: true}}};
      expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(false);
    });
  });

  describe('mapStateToProps deprecated', () => {
    it('should map pristine', () => {
      expect(mapStateToProps({}, {pristine: false}).touched).toEqual(true);
      expect(mapStateToProps({}, {$form: {pristine: false}}).touched).toEqual(true);
      expect(mapStateToProps({}, {pristine: true}).touched).toEqual(false);
      expect(mapStateToProps({}, {$form: {pristine: true}}).touched).toEqual(false);
    });
    it('should return hasError true when pristine and invalid', () => {
      expect(mapStateToProps({}, {pristine: false, valid: false}).hasError).toBe(true);
      expect(mapStateToProps({}, {$form: {pristine: false, valid: false}}).hasError).toBe(true);
    });

    it('should return hasError true when submitFailed and valid false', () => {
      expect(mapStateToProps({}, {submitFailed: true, valid: false}).hasError).toBe(true);
      expect(mapStateToProps({}, {submitFailed: true, $form: {valid: false}}).hasError).toBe(true);
    });

    it('should return hasError false when submitFailed with no errors', () => {
      expect(mapStateToProps({}, {submitFailed: true}).hasError).toBe(false);
    });
  });
});
