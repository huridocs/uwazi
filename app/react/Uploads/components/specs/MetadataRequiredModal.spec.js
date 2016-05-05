import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {MetadataRequiredModal} from 'app/Uploads/components/MetadataRequiredModal.js';
import Modal from 'app/Layout/Modal';

describe('MetadataRequiredModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      loadDocument: jasmine.createSpy('loadDocument'),
      editDocument: jasmine.createSpy('editDocument'),
      doc: Immutable.fromJS({_id: 'docId', title: 'test'}),
      templates: Immutable.fromJS([{_id: 'templateid', name: 'ruling'}])
    };
  });

  let render = () => {
    component = shallow(<MetadataRequiredModal {...props} />);
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking edit metadata button', () => {
    it('should open the metadata form and close the modal', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('metadataRequired');
      expect(props.loadDocument).toHaveBeenCalledWith(props.doc.toJS(), props.templates.toJS());
      expect(props.editDocument).toHaveBeenCalledWith(props.doc.toJS());
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('metadataRequired');
    });
  });
});
