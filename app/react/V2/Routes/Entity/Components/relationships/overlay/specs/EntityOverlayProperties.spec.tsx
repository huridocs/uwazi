/* eslint-disable react/no-multi-comp */
/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { EntityOverlayProperties } from '../EntityOverlayProperties.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  I18NLinkV2: ({
    children,
    to,
    title,
  }: {
    children: React.ReactNode;
    to: string;
    title?: string;
  }) => (
    <a href={to} title={title}>
      {children}
    </a>
  ),
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: ({ height, showControls }: { height?: number; showControls?: boolean }) => (
    <div data-testid="map" data-height={height} data-show-controls={String(showControls)} />
  ),
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  MediaPlayer: ({ height }: { height?: number | string }) => (
    <div data-testid="media-player" data-height={height} />
  ),
}));

const renderProperties = (metadata: MetadataProperty[]) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [settingsAtom, { features: {} }],
        [templatesAtom, [{ _id: 'tmpl-a', name: 'Person', color: '#111' }]],
      ]}
    >
      <EntityOverlayProperties metadata={metadata} translationContext="tmpl" />
    </TestAtomStoreProvider>
  );

describe('EntityOverlayProperties', () => {
  it('renders typed compact image and preserves metadata order', () => {
    renderProperties([
      {
        _id: 'p-text',
        name: 'summary',
        type: 'text',
        label: 'Summary',
        values: [{ value: 'Hello' }],
      },
      {
        _id: 'p-image',
        name: 'photo',
        type: 'image',
        label: 'Photo',
        style: 'contain',
        values: [{ value: '/api/files/photo.jpg', alt: 'Cover' }],
      },
      {
        _id: 'p-geo',
        name: 'loc',
        type: 'geolocation',
        label: 'Location',
        values: [{ value: { latitude: 1, longitude: 2 }, label: 'HQ' }],
      },
    ]);

    const labels = screen.getAllByText(/Summary|Photo|Location/).map(node => node.textContent);
    expect(labels).toEqual(['Summary', 'Photo', 'Location']);

    const img = screen.getByRole('img', { name: 'Cover' });
    expect(img).toHaveAttribute('src', '/api/files/photo.jpg');
    expect(img.className).toContain('max-h-32');
    expect(img.className).toContain('w-full');

    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '160');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'false');
  });

  it('renders media at compact height and relationship pills', () => {
    renderProperties([
      {
        _id: 'p-media',
        name: 'clip',
        type: 'media',
        label: 'Clip',
        values: [{ value: '/api/files/clip.mp4' }],
      },
      {
        _id: 'p-rel',
        name: 'related',
        type: 'relationship',
        mode: 'related',
        label: 'Related',
        values: [{ _id: 'e2', title: 'Person 2', templateId: 'tmpl-a' }],
      },
    ]);

    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '140');
    expect(within(screen.getByText('Related').parentElement!).getByText('Person 2')).toBeTruthy();
  });
});
