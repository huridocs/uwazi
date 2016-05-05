import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {ReadyToPublishModal} from 'app/Uploads/components/ReadyToPublishModal.js';
import Modal from 'app/Layout/Modal';

describe('ReadyToPublishModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      finishEdit: jasmine.createSpy('finishEdit'),
      moveToLibrary: jasmine.createSpy('moveToLibrary'),
      doc: Immutable.fromJS({_id: 'docId', title: 'test'})
    };
  });

  let render = () => {
    component = shallow(<ReadyToPublishModal {...props} />);
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking confirm button', () => {
    it('should publish the document and close the modal and the form', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.finishEdit).toHaveBeenCalled();
      expect(props.hideModal).toHaveBeenCalledWith('readyToPublish');
      expect(props.moveToLibrary).toHaveBeenCalledWith(props.doc.toJS());
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('readyToPublish');
    });
  });
});
