import React from 'react';
import {shallow} from 'enzyme';

import {DeleteTemplateConfirm} from 'app/Metadata/components/DeleteTemplateConfirm.js';
import Modal from 'app/Layout/Modal';

describe('DeleteTemplateConfirm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      deleteTemplate: jasmine.createSpy('deleteTemplate'),
      template: {_id: 2}
    };
  });

  let render = () => {
    component = shallow(<DeleteTemplateConfirm {...props} />);
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
    it('should call deleteTemplate and hideModal', () => {
      render();
      component.find('.btn-danger').simulate('click');
      expect(props.deleteTemplate).toHaveBeenCalledWith({_id: 2});
      expect(props.hideModal).toHaveBeenCalledWith('DeleteTemplateConfirm');
    });
  });

  describe('when clicking cancel button or close button', () => {
    it('should call hideRemovePropertyConfirm', () => {
      render();
      component.find('.btn-default').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('DeleteTemplateConfirm');
    });
  });
});
