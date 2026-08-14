/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MediaPickerModal } from '../MediaPickerModal.js';
import type { MediaPickerModalProps } from '../MediaPickerModal.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_context: string, key: string) => key,
}));

const imageFile = {
  _id: 'img1',
  originalname: 'photo.jpg',
  filename: 'photo.jpg',
  mimetype: 'image/jpeg',
};

const audioFile = {
  _id: 'aud1',
  originalname: 'clip.mp3',
  filename: 'clip.mp3',
  mimetype: 'audio/mpeg',
};

const renderModal = (overrides: Partial<MediaPickerModalProps> = {}) => {
  const onSelect = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(
    <MediaPickerModal
      isOpen
      mode="image"
      attachments={[]}
      {...overrides}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
  return { onSelect, onClose };
};

describe('MediaPickerModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <MediaPickerModal
        isOpen={false}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        mode="image"
        attachments={[]}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('labels the dialog and file input for image and media', () => {
    const { rerender } = render(
      <MediaPickerModal
        isOpen
        onClose={jest.fn()}
        onSelect={jest.fn()}
        mode="image"
        attachments={[]}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Select image' })).toBeInTheDocument();
    expect(screen.getByLabelText('Image file')).toHaveAttribute('accept', 'image/*');

    rerender(
      <MediaPickerModal
        isOpen
        onClose={jest.fn()}
        onSelect={jest.fn()}
        mode="media"
        attachments={[]}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Select media' })).toBeInTheDocument();
    expect(screen.getByLabelText('Media file')).toHaveAttribute('accept', 'video/*,audio/*');
  });

  it('selects a local file', async () => {
    const { onSelect, onClose } = renderModal();
    const file = new File(['img'], 'local.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Image file'), { target: { files: [file] } });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('', file);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('selects a dropped file', async () => {
    const { onSelect, onClose } = renderModal();
    const file = new File(['img'], 'drop.png', { type: 'image/png' });

    fireEvent.drop(screen.getByRole('button', { name: /select an image/i }), {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('', file);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('selects a valid URL', async () => {
    const { onSelect, onClose } = renderModal();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/a.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use URL' }));

    await waitFor(() => {
      expect(onSelect.mock.calls[0][0]).toBe('https://example.com/a.jpg');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error for an invalid URL', () => {
    const { onSelect } = renderModal();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use URL' }));

    expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('lists matching attachments and selects one', async () => {
    const { onSelect } = renderModal({ attachments: [imageFile, audioFile] });

    expect(screen.queryByRole('button', { name: /clip.mp3/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /photo.jpg/ }));

    await waitFor(() => {
      expect(onSelect.mock.calls[0][0]).toBe('/api/files/photo.jpg');
    });
  });

  it('closes from Cancel', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
