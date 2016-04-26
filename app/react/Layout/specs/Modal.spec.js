import React from 'react';
import {shallow} from 'enzyme';

import Modal from 'app/Layout/Modal';
import ReactModal from 'react-modal';

describe('Modal', () => {
  let component;

  let render = (props = {}) => {
    component = shallow(<Modal {...props}><div></div></Modal>);
  };

  it('should render children', () => {
    render({isOpen: false});
    expect(component.find(ReactModal).props().isOpen).toBe(false);
  });

  it('should be hidden by default', () => {
    render({isOpen: true});
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });
});
