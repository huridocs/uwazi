import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as immutable } from 'immutable';
import { I18NLink } from 'app/I18N';

import { Icon } from 'UI';

import { ShareButton } from 'app/Permissions/components/ShareButton';
import { MetadataFormButtons } from '../MetadataFormButtons';

describe('MetadataFormButtons', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      resetForm: jasmine.createSpy('resetForm'),
      clearMetadataSelections: jasmine.createSpy('resetForm'),
      delete: jasmine.createSpy('delete'),
      data: immutable({ test: 'test', sharedId: 'shId', file: {} }),
      templates: immutable([{ test: 'test' }]),
      formName: 'FormName',
      formStatePath: 'form',
      includeViewButton: true,
      exclusivelyViewButton: false,
      copyFrom: jasmine.createSpy('copyFrom'),
      uploadFileprogress: undefined,
      formState: { $form: { pending: false } },
    };
  });

  const render = () => {
    component = shallow(<MetadataFormButtons {...props} />, { context });
  };

  describe('view', () => {
    beforeEach(() => {
      render();
    });

    it('should include a visible view button with the correct link', () => {
      const link = component.find(I18NLink);
      expect(link.props().to).toBe('entity/shId');
    });

    it('should not show the button if prop not true', () => {
      props.includeViewButton = false;
      render();
      expect(component.find(I18NLink).length).toBe(0);
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      render();
    });

    it('should load the entity on the reduxForm', () => {
      component.find('.edit-metadata').at(1).simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalledWith(
        props.formStatePath,
        props.data.toJS(),
        props.templates.toJS()
      );
    });

    it('should clear metadata extraction selections', () => {
      component.find('.edit-metadata').at(1).simulate('click');
      expect(props.clearMetadataSelections).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should have a submit button that submits the formName passed', () => {
      props.entityBeingEdited = true;
      render();
      const submit = component.find('button[type="submit"]');
      expect(submit.props().form).toBe(props.formName);
    });

    it.each(['.cancel-edit-metadata', 'button[type="submit"]', '.copy-from-btn'])(
      'should disable cancel, edit, and copy from buttons if its processing files',
      selector => {
        props.entityBeingEdited = true;
        props.uploadFileprogress = 10;
        render();
        const button = component.find(selector);
        expect(button.props()).toMatchObject({ disabled: true });
      }
    );

    it('should disable the buttons while the form submits', () => {
      props.entityBeingEdited = true;
      props.formState.$form.pending = true;
      render();
      const buttons = component.find('button');
      buttons.forEach(button => expect(button.props().disabled).toBe(true));
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
      props.entityBeingEdited = true;
      render();
      component.find('.cancel-edit-metadata').simulate('click');
      expect(props.resetForm).toHaveBeenCalledWith(props.formStatePath);
    });
  });

  describe('copy from', () => {
    beforeEach(() => {
      render();
    });

    it('should call the callback', () => {
      props.entityBeingEdited = true;
      render();
      component.find('.copy-from-btn').simulate('click');
      expect(props.copyFrom).toHaveBeenCalled();
    });
  });

  describe('Share', () => {
    it('should pass the sharedId to the share button', () => {
      render();
      const shareBtn = component.find(ShareButton);
      expect(shareBtn.props().sharedIds).toEqual(['shId']);
    });

    it('should not render share button', () => {
      props.entityBeingEdited = true;
      render();
      expect(component.find(ShareButton).length).toBe(0);
    });

    it('should not render share button if no data', () => {
      props.data = props.data.set('sharedId', null);
      render();
      expect(component.find(ShareButton).length).toBe(0);
    });
  });

  describe('exclusivelyViewButton', () => {
    beforeEach(() => {
      props.exclusivelyViewButton = true;
      render();
    });

    it('should only render a view button', () => {
      const link = component.find(I18NLink);
      expect(link.props().to).toBe('entity/shId');
      expect(component.find('.edit-metadata').length).toBe(1);
      expect(component.find('.edit-metadata').at(0).find(Icon).props().icon).toBe('file');
      expect(component.find('.btn-success').length).toBe(0);
      expect(component.find('.delete-metadata').length).toBe(0);
    });
  });
});
