/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { ImageViewer, ImageViewerProps } from '../ImageViewer';

describe('ImageViewer', () => {
  const props: ImageViewerProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Example Image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = async () => {
    await act(async () => {
      renderConnectedContainer(<ImageViewer src={props.src} alt={props.alt} />, () => defaultState);
    });
  };

  it('should render the image if it exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await renderComponent();

    const img = screen.getByAltText(props.alt);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', props.src);
  });

  it('should handle image load errors with onError', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await renderComponent();

    const img = screen.getByAltText(props.alt);
    expect(img).toBeInTheDocument();

    // Simulate image load error
    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    expect(screen.getByText('Error loading your image')).toBeInTheDocument();
  });
});
