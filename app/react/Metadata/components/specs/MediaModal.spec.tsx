import React from 'react';
import thunk from 'redux-thunk';
import { shallow, ShallowWrapper } from 'enzyme';
import ReactModal from 'react-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { MediaModal, MediaModalProps, MediaModalType } from '../MediaModal';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('Attachments Modal', () => {
  let component: ShallowWrapper;
  let props: MediaModalProps;

  beforeEach(() => {
    props = {
      onClose: jasmine.createSpy('onClose'),
      onChange: jasmine.createSpy('onChange'),
      isOpen: true,
      attachments: [],
      selectedId: null,
    };
  });

  const render = (otherProps = {}) => {
    component = shallow(
      <Provider store={store}>
        <MediaModal {...props} {...otherProps} />
      </Provider>
    ).dive();
  };

  it('Should pass isOpen props to Media modal.', () => {
    render({ isOpen: false });
    expect(component.find(ReactModal).props().isOpen).toBe(false);
    render({ isOpen: true });
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });

  it('Should call onClose', () => {
    render();

    const closeButton = component.find('.attachments-modal__close');
    closeButton.simulate('click');

    expect(props.onClose).toHaveBeenCalled();
  });

  it('Should select attachment', () => {
    const jpgAttachment = { _id: 123, filename: 'test.jpg', size: 1234 };
    render({ attachments: [jpgAttachment] });

    const firstAttachment = component.find('.media-grid-item');
    firstAttachment.simulate('click');

    expect(props.onClose).toHaveBeenCalled();
  });

  it('Should show only images', () => {
    const videoAttachment = { _id: 123, filename: 'video.mp4', size: 1234, mimetype: 'video/mp4' };
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment, videoAttachment], type: MediaModalType.Image });

    const attachments = component.find('.media-grid-item');

    expect(attachments.length).toBe(1);
  });

  it('Should show only media', () => {
    const videoAttachment = { _id: 123, filename: 'video.mp4', size: 1234, mimetype: 'video/mp4' };
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment, videoAttachment], type: MediaModalType.Media });

    const attachments = component.find('.media-grid-item');

    expect(attachments.length).toBe(1);
  });

  it('Should show empty message', () => {
    render();

    const msg = component.find('.empty-attachments-message');

    expect(msg.length).toBe(1);
  });

  it('Should have selected attachment', () => {
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment], selectedId: jpgAttachment._id });

    const selectedAttachment = component.find('.media-grid .active');

    expect(selectedAttachment.length).toBe(1);
  });
});
