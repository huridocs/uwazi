import React from 'react';
import {shallow} from 'enzyme';

import Confirm from '../Confirm';
import Modal from 'app/Layout/Modal';

describe('CantDeleteTemplateAlert', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      accept: jasmine.createSpy('accept'),
      cancel: jasmine.createSpy('cancel'),
      isOpen: false
    };
  });

  let render = () => {
    component = shallow(<Confirm {...props} />);
  };

  it('should render a default closed modal', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(false);
  });

  describe('when clicking ok button', () => {
    it('should call accept function', () => {
      render();
      component.find('.btn-danger').simulate('click');
      expect(props.accept).toHaveBeenCalled();
    });
  });

  describe('when clicking cancel button', () => {
    it('should call cancel function', () => {
      render();
      component.find('.btn-default').simulate('click');
      expect(props.cancel).toHaveBeenCalled();
    });
  });
});
