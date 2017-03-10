import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {I18NLink} from 'app/I18N';

import {UploadsFormPanelButtons} from '../UploadsFormPanelButtons';

describe('UploadsFormPanelButtons', () => {
  let component;
  let props;
  let confirm;

  let render = () => {
    component = shallow(<UploadsFormPanelButtons {...props}/>, {context: {confirm}});
  };

  beforeEach(() => {
    confirm = jasmine.createSpy('confirm');
    props = {
      metadata: {type: 'type', sharedId: 'sharedId'},
      moveToLibrary: jasmine.createSpy('moveToLibrary'),
      publishEntity: jasmine.createSpy('publishEntity'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      deleteEntity: jasmine.createSpy('deleteEntity'),
      deleteDocument: jasmine.createSpy('deleteDocument')
    };
  });

  describe('view button', () => {
    it('should link to the document/entity', () => {
      render();
      const link = component.find(I18NLink);
      expect(link.props().to).toBe('type/sharedId');
    });

    it('should be shown only if content is viewable', () => {
      render();
      expect(component.find(I18NLink).parent().props().if).toBe(false);

      props.metadata.processed = true;
      render();
      expect(component.find(I18NLink).parent().props().if).toBe(true);

      props.metadata.processed = false;
      props.metadata.type = 'entity';
      render();
      expect(component.find(I18NLink).parent().props().if).toBe(true);
    });
  });

  describe('submit button', () => {
    it('should be rendered when metadata is defined', () => {
      props.metadataBeingEdited = Immutable.fromJS({});
      render();
      expect(component.find('[type="submit"]').props().form).toBe('metadataForm');
    });
  });

  describe('publish button', () => {
    let publishButton;

    function preparePublishData() {
      render();
      publishButton = component.find('button').at(1);
    }

    it('should confirm publishing', () => {
      preparePublishData();
      expect(confirm).not.toHaveBeenCalled();
      publishButton.simulate('click');
      expect(confirm).toHaveBeenCalled();
    });

    it('should only show if metadata has a template assigned', () => {
      preparePublishData();
      expect(publishButton.parent().props().if).toBe(false);

      props.metadata.template = 'template';
      preparePublishData();
      expect(publishButton.parent().props().if).toBe(true);
    });

    describe('upon Confirm', () => {
      let accept;

      function preparePublishDataConfirm() {
        preparePublishData();
        publishButton.simulate('click');
        accept = confirm.calls.mostRecent().args[0].accept;
      }

      it('should publish entity and finish edit', () => {
        preparePublishDataConfirm();
        accept();
        expect(props.moveToLibrary).not.toHaveBeenCalled();
        expect(props.publishEntity).toHaveBeenCalledWith(props.metadata);
        expect(props.unselectAllDocuments).toHaveBeenCalled();
      });

      it('should call move to library if document', () => {
        props.metadata.type = 'document';
        preparePublishDataConfirm();
        accept();
        expect(props.moveToLibrary).toHaveBeenCalledWith(props.metadata);
      });
    });
  });

  describe('delete button', () => {
    let deleteButton;

    function prepareDeleteData() {
      render();
      deleteButton = component.find('button').at(2);
    }

    it('should confirm deleting', () => {
      prepareDeleteData();
      expect(confirm).not.toHaveBeenCalled();
      deleteButton.simulate('click');
      expect(confirm).toHaveBeenCalled();
    });

    it('should only show if metadata has a sharedId', () => {
      prepareDeleteData();
      expect(deleteButton.parent().props().if).toBe(true);

      props.metadata.sharedId = null;
      prepareDeleteData();
      expect(deleteButton.parent().props().if).toBe(false);
    });

    describe('upon Confirm', () => {
      let accept;

      function prepareDeleteDataConfirm() {
        prepareDeleteData();
        deleteButton.simulate('click');
        accept = confirm.calls.mostRecent().args[0].accept;
      }

      it('should delete entity', () => {
        prepareDeleteDataConfirm();
        accept();
        expect(props.unselectAllDocuments).toHaveBeenCalled();
        expect(props.deleteEntity).toHaveBeenCalledWith(props.metadata);
        expect(props.deleteDocument).not.toHaveBeenCalled();
      });

      it('should delete document if document', () => {
        props.metadata.type = 'document';
        prepareDeleteDataConfirm();
        accept();
        expect(props.unselectAllDocuments).toHaveBeenCalled();
        expect(props.deleteDocument).toHaveBeenCalledWith(props.metadata);
        expect(props.deleteEntity).not.toHaveBeenCalled();
      });
    });
  });

  describe('save button', () => {
    it('should be of type submit for metadataForm', () => {
      render();
      const submitButton = component.find('button').at(3);
      expect(submitButton.props().type).toBe('submit');
      expect(submitButton.props().form).toBe('metadataForm');
    });
  });
});
