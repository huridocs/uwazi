import React from 'react';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import ReactModal from 'react-modal';

import AttachmentsModal from '../AttachmentsModal';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('Attachments Modal', () => {
  let component;

  const render = (props = {}) => {
    component = shallow(<AttachmentsModal {...props} store={store} />).dive();
  };

  it('Should pass isOpen props to attachments modal.', () => {
    render({ isOpen: false });
    expect(component.find(ReactModal).props().isOpen).toBe(false);
    render({ isOpen: true });
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });

  it('Should match render of upload form', () => {
    render();

    expect(component).toMatchSnapshot();
  });

  it('Should match render of web form', () => {
    render();

    component.find('.modal-tab-2').simulate('click');

    expect(component).toMatchSnapshot();
  });

  
});
