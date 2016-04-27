import React from 'react';
import {shallow} from 'enzyme';

import Modal from 'app/Layout/Modal';
import ReactModal from 'react-modal';

describe('Modal', () => {
  let component;

  let render = (props = {}) => {
    component = shallow(<Modal {...props}><div></div></Modal>);
  };

  it('should pass isOpen props', () => {
    render({isOpen: false});
    expect(component.find(ReactModal).props().isOpen).toBe(false);
    render({isOpen: true});
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });

  it('should append type passed to modal class and render default success if nothing passed', () => {
    render({type: 'modalType'});
    expect(component.find(ReactModal).hasClass('modal-modalType')).toBe(true);
    render();
    expect(component.find(ReactModal).hasClass('modal-success')).toBe(true);
  });
});
