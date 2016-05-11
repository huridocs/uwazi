import React from 'react';
import {shallow} from 'enzyme';

import {DeleteRelationTypeConfirm} from 'app/Metadata/components/DeleteRelationTypeConfirm.js';
import Modal from 'app/Layout/Modal';

describe('DeleteRelationTypeConfirm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      deleteRelationType: jasmine.createSpy('deleteRelationType'),
      relationType: {_id: 2}
    };
  });

  let render = () => {
    component = shallow(<DeleteRelationTypeConfirm {...props} />);
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
    it('should call deleteRelationType and hideModal', () => {
      render();
      component.find('.btn-danger').simulate('click');
      expect(props.deleteRelationType).toHaveBeenCalledWith({_id: 2});
      expect(props.hideModal).toHaveBeenCalledWith('DeleteRelationTypeConfirm');
    });
  });

  describe('when clicking cancel button or close button', () => {
    it('should call hideRemovePropertyConfirm', () => {
      render();
      component.find('.btn-default').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('DeleteRelationTypeConfirm');
    });
  });
});
