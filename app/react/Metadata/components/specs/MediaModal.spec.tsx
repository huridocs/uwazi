/**
 * @jest-environment jsdom
 */
import { ReactWrapper } from 'enzyme';
import ReactModal from 'react-modal';
import ReactPlayer from 'react-player';
import { actions as formActions } from 'react-redux-form';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { RenderAttachment } from 'app/Attachments/components/RenderAttachment';
import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';
import * as supportingFileActions from 'app/Metadata/actions/supportingFilesActions';
import { MediaModal, MediaModalProps, MediaModalType } from '../MediaModal';

const store = {
  library: {
    sidepanel: {
      metadata: {
        _id: '1',
        sharedId: 'entity1',
        attachments: [],
        metadata: { image: '' },
      },
    },
  },
};

describe('Media Modal', () => {
  let component: ReactWrapper;
  let props: MediaModalProps;

  beforeEach(() => {
    spyOn(formActions, 'change').and.returnValue({ type: 'rrf/change' });
    spyOn(supportingFileActions, 'uploadLocalAttachment').and.returnValue({
      type: 'ATTACHMENT_PROGRESSe',
    });
    props = {
      onClose: jasmine.createSpy('onClose'),
      onChange: jasmine.createSpy('onChange'),
      isOpen: true,
      attachments: [],
      formModel: 'library.sidepanel.metadata',
      formField: 'library.sidepanel.metadata.metadata.image',
      type: MediaModalType.Image,
      multipleEdition: false,
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
    const jpgAttachment = { _id: 123, filename: 'test.jpg', size: 1234, mimetype: 'image/jpg' };
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

  it('Should select a video attachment with url', () => {
    const testUrl = 'www.externalresource.com/video';
    jest.spyOn(ReactPlayer, 'canPlay').mockReturnValue(true);
    const videoAttachment = { _id: 123, url: testUrl, name: 'short video' };
    render({ attachments: [videoAttachment], type: MediaModalType.Media });

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

  describe('Upload file', () => {
    it('Should upload file from url', () => {
      render();

      const testAttachment = 'http://test.test/test.jpg';
      const form = component.find(WebMediaResourceForm).at(0);
      const formData = { url: testAttachment };
      form.props().handleSubmit(formData);
      expect(props.onChange).toHaveBeenCalledWith(testAttachment);
      expect(props.onClose).toHaveBeenCalled();
    });

    it('Should upload and select a new file', () => {
      const newFile = new File([Buffer.from('image').toString('base64')], 'image.jpg', {
        type: 'image/jpg',
      });
      render();
      component.find('input[type="file"]').simulate('change', {
        target: {
          files: [newFile],
        },
      });
      expect(supportingFileActions.uploadLocalAttachment).toHaveBeenCalledWith(
        'entity1',
        newFile,
        {
          __reducerKey: 'library',
          model: 'library.sidepanel.metadata',
        },
        expect.stringMatching(/^[a-zA-Z\d_]*$/)
      );
      expect(formActions.change).toHaveBeenCalledWith(
        'library.sidepanel.metadata.metadata.image',
        expect.stringMatching(/^[a-zA-Z\d_]*$/)
      );
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should not display the button to upload from local files in multiedit forms', () => {
      props.multipleEdition = true;
      render();
      expect(component.find('input[type="file"]').length).toBe(0);
    });
  });
});
