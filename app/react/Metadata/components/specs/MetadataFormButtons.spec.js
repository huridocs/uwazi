import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';

import {MetadataFormButtons} from '../MetadataFormButtons';

describe('MetadataFormButtons', () => {
  let component;
  let props;
  let context;


  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      resetForm: jasmine.createSpy('resetForm'),
      delete: jasmine.createSpy('delete'),
      data: immutable({test: 'test'}),
      templates: immutable([{test: 'test'}]),
      formName: 'FormName',
      formStatePath: 'form'
    };
  });

  let render = () => {
    component = shallow(<MetadataFormButtons {...props} />, {context});
  };

  describe('edit', () => {
    beforeEach(() => {
      render();
    });

    it('should load the entity on the reduxForm', () => {
      component.find('.edit-metadata').simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalledWith(props.formStatePath, props.data.toJS(), props.templates.toJS());
    });
  });

  describe('save', () => {
    beforeEach(() => {
      render();
    });

    it('should have a submit button that submits the formName passed', () => {
      const submit = component.find('button[type="submit"]');
      expect(submit.props().form).toBe(props.formName);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      render();
    });

    it('should execute delete method', () => {
      component.find('.delete-metadata').simulate('click');
      expect(props.delete).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      render();
    });

    it('should reset the form', () => {
      component.find('.cancel-edit-metadata').simulate('click');
      expect(props.resetForm).toHaveBeenCalledWith(props.formStatePath);
    });
  });
});
