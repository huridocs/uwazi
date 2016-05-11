import React from 'react';
import {shallow} from 'enzyme';

import {CantDeleteRelationType} from 'app/Metadata/components/CantDeleteRelationType.js';
import Modal from 'app/Layout/Modal';

describe('CantDeleteRelationType', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      references: 23
    };
  });

  let render = () => {
    component = shallow(<CantDeleteRelationType {...props} />);
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
      expect(props.hideModal).toHaveBeenCalledWith('CantDeleteRelationType');
    });
  });
});
