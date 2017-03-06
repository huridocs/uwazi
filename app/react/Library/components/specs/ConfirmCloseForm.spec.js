import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import Modal from 'app/Layout/Modal';

import {ConfirmCloseForm} from '../ConfirmCloseForm';

describe('ConfirmCloseForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      resetForm: jasmine.createSpy('resetForm'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      doc: Immutable.fromJS({_id: 'docId', title: 'test'})
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
      expect(props.resetForm).toHaveBeenCalledWith('library.sidepanel.metadata');
      expect(props.unselectDocument).toHaveBeenCalledWith('docId');
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
