import React from 'react';
import {shallow} from 'enzyme';

import Modal from 'app/Layout/Modal';

import {ConfirmCloseForm} from '../ConfirmCloseForm';

describe('ConfirmCloseForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      resetForm: jasmine.createSpy('resetForm'),
      closePanel: jasmine.createSpy('closePanel'),
      doc: {_id: 'docId', title: 'test'}
    };
  });

  let render = () => {
    component = shallow(<ConfirmCloseForm {...props} />);
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking Ok', () => {
    it('should close modal and reset form', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseForm');
      expect(props.resetForm).toHaveBeenCalledWith('documentViewer.docForm');
      expect(props.closePanel).toHaveBeenCalled();
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseForm');
    });
  });
});
