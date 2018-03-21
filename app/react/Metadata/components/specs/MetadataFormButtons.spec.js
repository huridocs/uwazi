import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';
import {I18NLink} from 'app/I18N';

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
      data: immutable({test: 'test', sharedId: 'shId', type: 'type'}),
      templates: immutable([{test: 'test'}]),
      formName: 'FormName',
      formStatePath: 'form',
      includeViewButton: true,
      exclusivelyViewButton: false
    };
  });

  let render = () => {
    component = shallow(<MetadataFormButtons {...props} />, {context});
  };

  describe('view', () => {
    beforeEach(() => {
      render();
    });

    it('should include a visible view button with the correct link', () => {
      const link = component.find(I18NLink);
      expect(link.props().to).toBe('type/shId');
      expect(link.parent().props().if).toBe(true);
    });

    it('should not show the button if prop not true', () => {
      props.includeViewButton = false;
      render();
      const link = component.find(I18NLink);

      expect(link.parent().props().if).toBe(false);
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      render();
    });

    it('should load the entity on the reduxForm', () => {
      component.find('.edit-metadata').at(1).simulate('click');
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

  describe('exclusivelyViewButton', () => {
    beforeEach(() => {
      props.exclusivelyViewButton = true;
      render();
    });

    it('should only render a view button', () => {
      const link = component.find(I18NLink);
      expect(link.props().to).toBe('type/shId');
      expect(component.find('.edit-metadata').length).toBe(1);
      expect(component.find('.edit-metadata').at(0).find('.fa-file-text-o').length).toBe(1);
      expect(component.find('.btn-success').length).toBe(0);
      expect(component.find('.delete-metadata').length).toBe(0);
    });
  });
});
