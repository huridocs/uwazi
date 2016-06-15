import React from 'react';
import {shallow} from 'enzyme';

import {ConfirmCloseReferenceForm} from '../ConfirmCloseReferenceForm';

describe('ConfirmCloseReferenceForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      reference: {},
      hideModal: jasmine.createSpy('hideModal'),
      resetReferenceCreation: jasmine.createSpy('resetReferenceCreation'),
      closePanel: jasmine.createSpy('closePanel')
    };
  });

  let render = () => {
    component = shallow(<ConfirmCloseReferenceForm {...props} />);
  };

  describe('when clicking Ok', () => {
    it('should close modal and reset reference', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseReferenceForm');
      expect(props.resetReferenceCreation).toHaveBeenCalled();
      expect(props.closePanel).toHaveBeenCalled();
    });
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('ConfirmCloseReferenceForm');
    });
  });
});
