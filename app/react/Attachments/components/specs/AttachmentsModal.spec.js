import React from 'react';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import { LocalForm } from 'react-redux-form';
import ReactModal from 'react-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import AttachmentsModal, { AttachmentsModalCmp } from '../AttachmentsModal';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('Attachments Modal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      entitySharedId: '123',
      storeKey: '456',
      onClose: jasmine.createSpy('onClose'),
      uploadAttachmentFromUrl: jasmine.createSpy('uploadAttachmentFromUrl'),
    };
  });

  const render = (otherProps = {}) => {
    component = shallow(
      <Provider store={store}>
        <AttachmentsModalCmp {...props} {...otherProps} />
      </Provider>
    )
      .dive();
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

  it('Should submit web form', () => {
    render();

    component.find('.modal-tab-2').simulate('click');
    component.find(LocalForm).simulate('submit', { url: 'http://test.test', name: 'testName' });

    expect(props.uploadAttachmentFromUrl).toHaveBeenCalled();
  });

  it('Should call onClose', () => {
    render();

    const closeButton = component.find('.attachments-modal__close');
    closeButton.simulate('click');

    expect(props.onClose).toHaveBeenCalled();
  });
});
