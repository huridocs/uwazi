import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  ShareEntityModal,
  ShareEntityModalProps,
} from 'app/Permissions/components/ShareEntityModal';

describe('ShareEntityModal', () => {
  let component: ShallowWrapper;

  const defaultProps: ShareEntityModalProps = {
    isOpen: true,
    onClose: jasmine.createSpy('onClose'),
    onSave: jasmine.createSpy('onSave'),
  };
  function render(args?: ShareEntityModalProps) {
    const props = { ...defaultProps, ...args };
    component = shallow(<ShareEntityModal {...props} />);
  }

  beforeEach(() => {
    render();
  });

  describe('Close modal', () => {
    it('should set isOpen with false', () => {
      component.find('.cancel-button').simulate('click');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Save changes', () => {
    it('should dispatch the saveSharing action', () => {
      component.find('.confirm-button').simulate('click');
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });
});
