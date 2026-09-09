/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { DataMarker } from '#app/Map/MapHelper.js';
import { MapViewer } from '../MapViewer.js';

jest.mock('#app/Map/index.js', () => ({
  Map: ({
    markers,
    clickOnMarker,
    renderPopupInfo,
  }: {
    markers?: {
      latitude: number;
      longitude: number;
      properties?: { entity?: { sharedId: string } };
    }[];
    clickOnMarker?: (marker: DataMarker) => void;
    renderPopupInfo?: boolean;
  }) => (
    <div
      data-testid="library-map"
      data-marker-count={markers?.length ?? 0}
      data-render-popup={String(Boolean(renderPopupInfo))}
    >
      {(markers ?? []).map(marker => (
        <button
          key={`${marker.latitude},${marker.longitude}`}
          type="button"
          onClick={() =>
            clickOnMarker?.({
              properties: marker.properties,
            } as DataMarker)
          }
        >
          marker-{marker.properties?.entity?.sharedId}
        </button>
      ))}
    </div>
  ),
}));

const templates = [
  {
    _id: 't1',
    name: 'Places',
    color: 'red',
    properties: [{ _id: 'p1', type: 'geolocation', name: 'location', label: 'Location' }],
  },
] as Template[];

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'place-1',
    language: 'en',
    title: 'Courthouse',
    template: 't1',
    metadata: {
      location: [{ value: { lat: 40.4, lon: -3.7, label: 'Madrid' } }],
    },
  },
];

const renderMap = (onSelect = jest.fn(), hits: LibrarySearchHit[] = rows) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <MapViewer rows={hits} totalRows={hits.length} onSelect={onSelect} />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('MapViewer', () => {
  it('renders the shared map with library markers and popups', () => {
    renderMap();
    const map = screen.getByTestId('library-map');
    expect(map).toHaveAttribute('data-marker-count', '1');
    expect(map).toHaveAttribute('data-render-popup', 'true');
    expect(screen.getByText('marker-place-1')).toBeInTheDocument();
  });

  it('selects the entity when a marker is clicked', () => {
    const onSelect = jest.fn();
    renderMap(onSelect);
    fireEvent.click(screen.getByText('marker-place-1'));
    expect(onSelect).toHaveBeenCalledWith('place-1');
  });

  it('shows an empty state when there are no geolocated entities', () => {
    renderMap(jest.fn(), []);
    expect(screen.getByText('No entities found')).toBeInTheDocument();
    expect(screen.queryByTestId('library-map')).not.toBeInTheDocument();
  });
});
