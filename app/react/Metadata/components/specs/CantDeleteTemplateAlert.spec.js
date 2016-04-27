import React from 'react';
import {shallow} from 'enzyme';

import {CantDeleteTemplateAlert} from 'app/Metadata/components/CantDeleteTemplateAlert.js';
import Modal from 'app/Layout/Modal';

describe('CantDeleteTemplateAlert', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      documents: 55
    };
  });

  let render = () => {
    component = shallow(<CantDeleteTemplateAlert {...props} />);
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

  describe('when clicking ok button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.btn').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('CantDeleteTemplateAlert');
    });
  });
});
