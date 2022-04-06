import React from 'react';
import thunk from 'redux-thunk';
import { shallow, ShallowWrapper } from 'enzyme';
import ReactModal from 'react-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';
import { AttachmentsModalCmp, AttachmentsModalProps } from '../AttachmentsModal';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('Attachments Modal', () => {
  let component: ShallowWrapper;
  let props: AttachmentsModalProps;

  beforeEach(() => {
    props = {
      entitySharedId: '123',
      storeKey: '456',
      onClose: jasmine.createSpy('onClose'),
      uploadAttachmentFromUrl: jasmine.createSpy('uploadAttachmentFromUrl'),
      isOpen: true,
      uploadAttachment: jasmine.createSpy('uploadAttachment'),
      model: '',
    };
  });

  const render = (otherProps = {}) => {
    component = shallow(
      <Provider store={store}>
        <AttachmentsModalCmp {...props} {...otherProps} />
      </Provider>
    ).dive();
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
    const form = component.find(WebMediaResourceForm).at(0);
    const formData = { url: 'http://test.test', name: 'testName' };
    form.props().handleSubmit(formData);
    expect(props.uploadAttachmentFromUrl).toHaveBeenCalledWith(props.entitySharedId, formData, {
      __reducerKey: props.storeKey,
      model: '',
    });
  });

  it('Should call onClose', () => {
    render();

    const closeButton = component.find('.attachments-modal__close');
    closeButton.simulate('click');

    expect(props.onClose).toHaveBeenCalled();
  });
});
