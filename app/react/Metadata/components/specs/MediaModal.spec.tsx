/**
 * @jest-environment jsdom
 */
import { ReactWrapper } from 'enzyme';
import ReactModal from 'react-modal';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { RenderAttachment } from 'app/Attachments/components/RenderAttachment';
import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';
import { MediaModal, MediaModalProps, MediaModalType } from '../MediaModal';

const store = {
  library: {
    sidepanel: {
      metadata: {
        _id: '1',
        sharedId: 'entity1',
        attachments: [],
      },
    },
  },
};

describe('Media Modal', () => {
  let component: ReactWrapper;
  let props: MediaModalProps;

  beforeEach(() => {
    props = {
      onClose: jasmine.createSpy('onClose'),
      onChange: jasmine.createSpy('onChange'),
      rrfChange: jasmine.createSpy('rrfChange'),
      isOpen: true,
      selectedUrl: null,
      attachments: [],
      formModel: 'library.sidepanel.metadata',
      formField: 'library.sidepanel.metadata.metadata.image',
    };
  });

  const render = (otherProps = {}) => {
    component = renderConnectedMount(MediaModal, store, { ...props, ...otherProps }, true);
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

  it('Should select attachment with filename', () => {
    const jpgAttachment = { _id: 123, filename: 'test.jpg', size: 1234 };
    render({ attachments: [jpgAttachment] });

    const firstAttachment = component.find('.media-grid-item');
    firstAttachment.simulate('click');

    expect(props.onChange).toHaveBeenCalledWith('/api/files/test.jpg');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('Should select attachment with url', () => {
    const testUrl = 'http://test.test/test.jpg';
    const jpgAttachment = { _id: 123, url: testUrl, size: 1234 };
    render({ attachments: [jpgAttachment] });

    const firstAttachment = component.find('.media-grid-item');
    firstAttachment.simulate('click');

    expect(props.onChange).toHaveBeenCalledWith(testUrl);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('Should show only images', () => {
    const videoAttachment = { _id: 123, filename: 'video.mp4', size: 1234, mimetype: 'video/mp4' };
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment, videoAttachment], type: MediaModalType.Image });

    const attachments = component.find(RenderAttachment);
    expect(attachments.at(0).props().attachment).toEqual(jpgAttachment);

    expect(attachments.length).toBe(1);
  });

  it('Should show only media', () => {
    const videoAttachment = { _id: 123, filename: 'video.mp4', size: 1234, mimetype: 'video/mp4' };
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment, videoAttachment], type: MediaModalType.Media });

    const attachments = component.find(RenderAttachment);
    expect(attachments.at(0).props().attachment).toEqual(videoAttachment);

    expect(attachments.length).toBe(1);
  });

  it('Should show empty message', () => {
    render();

    const msg = component.find('.empty-attachments-message');

    expect(msg.length).toBe(1);
  });

  it('Should have selected attachment', () => {
    const jpgAttachment = { _id: 456, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };

    render({ attachments: [jpgAttachment], selectedUrl: '/api/files/test.jpg' });

    const selectedAttachment = component.find('.media-grid .active');

    expect(selectedAttachment.length).toBe(1);
  });

  it('Should upload file from url', () => {
    render();

    const testAttachment = 'http://test.test/test.jpg';
    component.find('.modal-tab-2').at(0).simulate('click');

    const form = component.find(WebMediaResourceForm).at(0);
    const formData = { url: testAttachment };
    form.props().handleSubmit(formData);
    expect(props.onChange).toHaveBeenCalledWith(testAttachment);
    expect(props.onClose).toHaveBeenCalled();
  });

  describe('Upload file', () => {
    it('Should upload and select a new file', () => {
      const newFile = new File([Buffer.from('image').toString('base64')], 'image.jpg', {
        type: 'image/jpg',
      });
      render();
      component.find('.modal-tab-2').at(0).simulate('click');
      component.find('input[type="file"]').simulate('change', {
        target: {
          files: [newFile],
        },
      });
      // expect(localAttachmentAction).toHaveBeenCalledWith('');
      expect(props.rrfChange).toHaveBeenCalledWith({ value: '', attachment: 0 });
      expect(props.onClose).toHaveBeenCalled();
    });
  });
});
