import React from 'react';
import {shallow} from 'enzyme';

import {MultipleEditionFieldWarning, mapStateToProps} from '../MultipleEditionFieldWarning';

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  let render = () => {
    component = shallow(<MultipleEditionFieldWarning {...props} />);
  };

  describe('when multipleEdition and touched', () => {
    it('should render a warning', () => {
      props.multipleEdition = true;
      props.touched = true;
      render();
      let warning = component.find('.fa-warning');
      expect(warning.length).toBe(1);
    });
  });

  describe('when multipleEdition and not touched', () => {
    it('should not render a warning', () => {
      props.multipleEdition = true;
      props.touched = false;
      render();
      let warning = component.find('.fa-warning');
      expect(warning.length).toBe(0);
    });
  });

  describe('when not multipleEdition and touched', () => {
    it('should not render a warning', () => {
      props.multipleEdition = false;
      props.touched = true;
      render();
      let warning = component.find('.fa-warning');
      expect(warning.length).toBe(0);
    });
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
  });
});
