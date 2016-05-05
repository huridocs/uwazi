import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {ConfirmDocumentDeleteModal} from 'app/Uploads/components/ConfirmDocumentDeleteModal.js';
import Modal from 'app/Layout/Modal';

describe('ConfirmDocumentDeleteModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      deleteDocument: jasmine.createSpy('deleteDocument'),
      doc: Immutable.fromJS({_id: 'docId', title: 'test'})
    };
  });

  let render = () => {
    component = shallow(<ConfirmDocumentDeleteModal {...props} />);
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking delete document', () => {
    it('should delete the document and close the modal', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('deleteDocument');
      expect(props.deleteDocument).toHaveBeenCalledWith(props.doc.toJS());
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('deleteDocument');
    });
  });
});
