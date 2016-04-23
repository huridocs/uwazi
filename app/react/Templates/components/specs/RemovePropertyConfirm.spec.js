import React from 'react';
import {shallow} from 'enzyme';

import {RemovePropertyConfirm} from 'app/Templates/components/RemovePropertyConfirm.js';
import Modal from 'react-modal';

describe('RemovePropertyConfirm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideRemovePropertyConfirm: jasmine.createSpy('hideRemovePropertyConfirm'),
      removeProperty: jasmine.createSpy('removeProperty'),
      propertyBeingDeleted: 1
    };
  });

  let render = () => {
    component = shallow(<RemovePropertyConfirm {...props} />);
  };

  it('should render a default closed modal', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(false);
  });

  it('should pass isOpen', () => {
    props.isOpen = true;
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  describe('when clicking confirm button', () => {
    it('should call removeProperty and hideRemovePropertyConfirm', () => {
      render();
      component.find('.confirm-button').simulate('click');
      expect(props.removeProperty).toHaveBeenCalledWith(1);
      expect(props.hideRemovePropertyConfirm).toHaveBeenCalled();
    });
  });

  describe('when clicking cancel button or close button', () => {
    it('should call hideRemovePropertyConfirm', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideRemovePropertyConfirm).toHaveBeenCalled();

      component.find('.close').simulate('click');
      expect(props.hideRemovePropertyConfirm).toHaveBeenCalled();
    });
  });
});
