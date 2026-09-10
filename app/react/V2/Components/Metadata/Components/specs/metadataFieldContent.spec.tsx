/** @jest-environment jsdom */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderFieldContent } from '../metadataFieldContent.js';
import type {
  ImageMetadataProperty,
  MediaMetadataProperty,
  MetadataProperty,
} from '#V2/formatters/types.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: ({ height, showControls }: { height?: number; showControls?: boolean }) => (
    <div
      data-testid="map"
      data-height={height}
      data-show-controls={showControls === undefined ? 'undefined' : String(showControls)}
    />
  ),
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  MediaPlayer: ({ height }: { height?: number | string }) => (
    <div data-testid="media-player" data-height={height} />
  ),
}));

const imageProp: ImageMetadataProperty = {
  _id: 'p-image',
  name: 'photo',
  type: 'image',
  label: 'Photo',
  style: 'contain',
  fullWidth: false,
  values: [{ value: '/api/files/photo.jpg', alt: 'Cover' }],
};

const mediaProp: MediaMetadataProperty = {
  _id: 'p-media',
  name: 'clip',
  type: 'media',
  label: 'Clip',
  style: 'cover',
  fullWidth: false,
  values: [{ value: '/api/files/clip.mp4' }],
};

const geoProp: MetadataProperty = {
  _id: 'p-geo',
  name: 'loc',
  type: 'geolocation',
  label: 'Location',
  values: [{ value: { latitude: 1, longitude: 2 } }],
};

describe('renderFieldContent density', () => {
  it('uses Fit, Fill, and fullWidth image sizes when density omitted', () => {
    const { rerender } = render(<>{renderFieldContent(imageProp)}</>);
    expect(screen.getByRole('img').className).toContain('max-h-48');
    expect(screen.getByRole('img')).toHaveStyle({ objectFit: 'contain' });

    rerender(<>{renderFieldContent({ ...imageProp, style: 'cover' })}</>);
    expect(screen.getByRole('img')).toHaveStyle({ objectFit: 'cover' });
    expect(screen.getByRole('img').className).toContain('w-full');

    rerender(<>{renderFieldContent({ ...imageProp, fullWidth: true })}</>);
    expect(screen.getByRole('img').className).toContain('max-h-96');
  });

  it('uses default media and geo sizes when density omitted', () => {
    const { rerender } = render(<>{renderFieldContent(mediaProp)}</>);
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '100%');
    expect(screen.getByTestId('media-player').parentElement?.className).toContain('max-h-48');
    expect(screen.getByTestId('media-player').parentElement?.className).toContain('aspect-video');

    rerender(<>{renderFieldContent({ ...mediaProp, fullWidth: true })}</>);
    expect(screen.getByTestId('media-player').parentElement?.className).toContain('max-h-96');

    rerender(<>{renderFieldContent(geoProp)}</>);
    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '220');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'undefined');
  });

  it('uses compact image sizes including media-as-image', () => {
    const { rerender } = render(<>{renderFieldContent(imageProp, { density: 'compact' })}</>);
    expect(screen.getByRole('img').className).toContain('max-h-32');

    rerender(
      <>
        {renderFieldContent(
          { ...mediaProp, values: [{ value: '/api/files/photo.png' }] },
          { density: 'compact' }
        )}
      </>
    );
    expect(screen.getByRole('img').className).toContain('max-h-32');
  });

  it('uses compact video and geo sizes', () => {
    const { rerender } = render(<>{renderFieldContent(mediaProp, { density: 'compact' })}</>);
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '140');
    expect(screen.getByTestId('media-player').parentElement?.className).toContain('max-h-[140px]');
    expect(screen.getByTestId('media-player').parentElement?.className).not.toContain('max-h-32');

    rerender(<>{renderFieldContent(geoProp, { density: 'compact' })}</>);
    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '160');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'false');
  });
});
