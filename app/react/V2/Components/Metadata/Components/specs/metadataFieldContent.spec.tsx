/* eslint-disable react/no-multi-comp */
/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderFieldContent } from '../metadataFieldContent.js';
import type { MetadataProperty } from '#V2/formatters/types.js';

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

const imageProp: MetadataProperty = {
  _id: 'p-image',
  name: 'photo',
  type: 'image',
  label: 'Photo',
  style: 'contain',
  values: [{ value: '/api/files/photo.jpg', alt: 'Cover' }],
};

const mediaProp: MetadataProperty = {
  _id: 'p-media',
  name: 'clip',
  type: 'media',
  label: 'Clip',
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
  it('uses default image/media/geo sizes when density omitted', () => {
    const { rerender } = render(<>{renderFieldContent(imageProp)}</>);
    expect(screen.getByRole('img').className).toContain('max-h-96');

    rerender(<>{renderFieldContent(mediaProp)}</>);
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '300');

    rerender(<>{renderFieldContent(geoProp)}</>);
    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '500');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'undefined');
  });

  it('uses compact image/media/geo sizes', () => {
    const { rerender } = render(<>{renderFieldContent(imageProp, { density: 'compact' })}</>);
    expect(screen.getByRole('img').className).toContain('max-h-32');
    expect(screen.getByRole('img').className).toContain('w-full');

    rerender(<>{renderFieldContent(mediaProp, { density: 'compact' })}</>);
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '140');

    rerender(<>{renderFieldContent(geoProp, { density: 'compact' })}</>);
    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '160');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'false');
  });
});
