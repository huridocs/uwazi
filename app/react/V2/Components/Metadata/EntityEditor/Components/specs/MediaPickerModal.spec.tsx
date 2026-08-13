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

const imageUrlHelp =
  'Paste an image URL to use it as this property without uploading a file. Press Enter to apply.';
const mediaUrlHelp =
  'Paste an audio or video URL to use it as this property without uploading a file. Press Enter to apply.';

const imageFile = {
  _id: 'img1',
  originalname: 'photo.jpg',
  filename: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
};

const audioFile = {
  _id: 'aud1',
  originalname: 'clip.mp3',
  filename: 'clip.mp3',
  mimetype: 'audio/mpeg',
  size: 2048,
};

const videoFile = {
  _id: 'vid1',
  originalname: 'reel.mp4',
  filename: 'reel.mp4',
  mimetype: 'video/mp4',
};

const urlFile = {
  _id: 'url1',
  originalname: 'External clip',
  url: 'https://example.com/clip.mp4',
};

const renderModal = (
  overrides: {
    mode?: MediaPickerModalProps['mode'];
    attachments?: MediaPickerModalProps['attachments'];
    currentValue?: string;
    onSelect?: MediaPickerModalProps['onSelect'];
    onClose?: () => void;
    isOpen?: boolean;
  } = {}
) => {
  const onSelect = overrides.onSelect ?? jest.fn().mockResolvedValue(undefined);
  const onClose = overrides.onClose ?? jest.fn();

  render(
    <MediaPickerModal
      isOpen={overrides.isOpen ?? true}
      onClose={onClose}
      onSelect={onSelect}
      mode={overrides.mode ?? 'image'}
      attachments={overrides.attachments ?? []}
      currentValue={overrides.currentValue}
    />
  );

  return { onSelect, onClose };
};

describe('MediaPickerModal', () => {
  it('uses Select image title and image accept', () => {
    renderModal({ mode: 'image' });

    expect(screen.getByRole('dialog', { name: 'Select image' })).toBeInTheDocument();
    expect(screen.getByText('Select image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Click to select an image/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Image URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use URL' })).toBeInTheDocument();
    expect(screen.getByText('Or paste a URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Image file')).toHaveAttribute('accept', 'image/*');
    expect(screen.getByText('No images on this entity')).toBeInTheDocument();
  });

  it('uses Select media title and media accept', () => {
    renderModal({ mode: 'media' });

    expect(screen.getByRole('dialog', { name: 'Select media' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Click to select audio or video/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Media URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use URL' })).toBeInTheDocument();
    expect(screen.getByText('Or paste a URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Media file')).toHaveAttribute('accept', 'video/*,audio/*');
    expect(screen.getByText('No audio or video on this entity')).toBeInTheDocument();
  });

  it('selects a local file immediately', async () => {
    const { onSelect, onClose } = renderModal();
    const file = new File(['img'], 'local.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Image file'), { target: { files: [file] } });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('', file);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('selects a dropped file immediately', async () => {
    const { onSelect, onClose } = renderModal();
    const file = new File(['img'], 'drop.png', { type: 'image/png' });

    fireEvent.drop(screen.getByRole('button', { name: /Click to select an image/ }), {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('', file);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('submits a valid URL with the button or Enter', async () => {
    const { onSelect, onClose } = renderModal();
    const input = screen.getByRole('textbox', { name: 'Image URL' });

    fireEvent.change(input, { target: { value: 'https://example.com/a.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use URL' }));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('https://example.com/a.jpg');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('submits a valid URL on Enter', async () => {
    const { onSelect } = renderModal();
    const input = screen.getByRole('textbox', { name: 'Image URL' });

    fireEvent.change(input, { target: { value: 'https://example.com/b.jpg' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('https://example.com/b.jpg');
    });
  });

  it('shows an error for an invalid URL', () => {
    const { onSelect } = renderModal();

    fireEvent.change(screen.getByRole('textbox', { name: 'Image URL' }), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use URL' }));

    expect(screen.getByText('Invalid URL')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('picks an existing attachment and highlights the current value', async () => {
    const { onSelect } = renderModal({
      mode: 'image',
      attachments: [imageFile, audioFile],
      currentValue: '/api/files/photo.jpg',
    });

    const selected = screen.getByRole('button', { name: /photo.jpg/ });
    expect(selected).toHaveClass('bg-parchment');
    expect(screen.queryByRole('button', { name: /clip.mp3/ })).not.toBeInTheDocument();
    expect(selected.querySelector('img')).toHaveAttribute('alt', '');

    fireEvent.click(selected);
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('/api/files/photo.jpg');
    });
  });

  it('renders media glyphs for audio, video, and URL-only files', () => {
    renderModal({
      mode: 'media',
      attachments: [audioFile, videoFile, urlFile, imageFile],
    });

    expect(screen.getByRole('button', { name: /clip.mp3/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reel.mp4/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /External clip/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /photo.jpg/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('closes from Cancel and the close control', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('exposes unique button and textbox names', () => {
    renderModal({ mode: 'image', attachments: [imageFile] });

    const names = [
      ...screen.getAllByRole('button').map(el => el.getAttribute('aria-label') || el.textContent),
      ...screen.getAllByRole('textbox').map(el => el.getAttribute('aria-label')),
    ];
    expect(names.filter(Boolean)).toEqual([...new Set(names.filter(Boolean))]);
    expect(screen.getByLabelText('Image file')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Image URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use URL' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add file' })).not.toBeInTheDocument();
    expect(screen.queryByText('Supporting files')).not.toBeInTheDocument();
  });

  it('shows image URL help on hover and focus', () => {
    renderModal({ mode: 'image' });
    const trigger = screen.getByTestId('flowbite-tooltip-target');

    fireEvent.mouseOver(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent(imageUrlHelp);

    fireEvent.mouseOut(trigger);
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent(imageUrlHelp);
  });

  it('shows media URL help on hover and focus', () => {
    renderModal({ mode: 'media' });
    const trigger = screen.getByTestId('flowbite-tooltip-target');

    fireEvent.mouseOver(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent(mediaUrlHelp);

    fireEvent.mouseOut(trigger);
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent(mediaUrlHelp);
  });

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
});
