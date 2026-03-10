/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { AttachmentsModalCmp, AttachmentsModalProps } from '../AttachmentsModal';

describe('Attachments Modal', () => {
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
    const renderProps = { ...props, ...otherProps };
    renderConnectedContainer(<AttachmentsModalCmp {...renderProps} />, () => defaultState);
  };

  it('Should open the modal according to isOpen property value', () => {
    render({ isOpen: false });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    render({ isOpen: true });
    expect(screen.queryAllByRole('heading').length).toBe(2);
  });

  it('Should match render of upload form', () => {
    render({ isOpen: true });
    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });

  describe('Attachment from web', () => {
    beforeEach(() => {
      render({ isOpen: true });
      const webTab = screen.getByRole('tab', { name: 'Add from web' });
      fireEvent.click(webTab);
    });

    it('Should match render of web form', () => {
      expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('Should submit web form', () => {
      render();
      const urlInput = screen.getAllByRole('textbox');
      const attachmentData = { url: 'http://test.test', name: 'testName' };

      fireEvent.change(urlInput.at(0)!, { target: { value: attachmentData.url } });
      fireEvent.change(urlInput.at(1)!, { target: { value: attachmentData.name } });

      fireEvent.click(screen.getByRole('button', { name: 'Add from URL' }));
      expect(props.uploadAttachmentFromUrl).toHaveBeenCalledWith(
        props.entitySharedId,
        attachmentData,
        {
          __reducerKey: props.storeKey,
          model: '',
        }
      );
    });
  });

  it('Should call onClose', () => {
    render({ isOpen: true });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalled();
  });
});
