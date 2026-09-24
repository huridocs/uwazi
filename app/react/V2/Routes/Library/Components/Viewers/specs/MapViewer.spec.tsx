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
    clickOnCluster,
    renderPopupInfo,
  }: {
    markers?: {
      latitude: number;
      longitude: number;
      properties?: { entity?: { sharedId: string } };
    }[];
    clickOnMarker?: (
      marker: DataMarker,
      modifiers?: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
    ) => void;
    clickOnCluster?: (
      cluster: DataMarker[],
      modifiers?: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
    ) => void;
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
          onClick={event =>
            clickOnMarker?.(
              {
                properties: marker.properties,
              } as DataMarker,
              {
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
              }
            )
          }
        >
          marker-{marker.properties?.entity?.sharedId}
        </button>
      ))}
      <button
        type="button"
        onClick={event =>
          clickOnCluster?.(
            (markers ?? []).map(
              marker =>
                ({
                  properties: marker.properties,
                }) as DataMarker
            ),
            {
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
            }
          )
        }
      >
        cluster
      </button>
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

const renderMap = (
  onSelect = jest.fn(),
  hits: LibrarySearchHit[] = rows,
  onSelectCluster?: (sharedIds: string[], modifiers?: { ctrlKey: boolean }) => void
) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <MapViewer
          rows={hits}
          totalRows={hits.length}
          onSelect={onSelect}
          onSelectCluster={onSelectCluster}
        />
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
    expect(onSelect).toHaveBeenCalledWith('place-1', {
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });
  });

  it('forwards ctrl and cmd clicks so a marker can be toggled', () => {
    const onSelect = jest.fn();
    renderMap(onSelect);
    fireEvent.click(screen.getByText('marker-place-1'), { ctrlKey: true });
    expect(onSelect).toHaveBeenCalledWith('place-1', {
      shiftKey: false,
      ctrlKey: true,
      metaKey: false,
    });
  });

  it('selects every entity in a clicked cluster', () => {
    const onSelectCluster = jest.fn();
    const second: LibrarySearchHit = {
      ...rows[0]!,
      _id: '2',
      sharedId: 'place-2',
      title: 'Plaza',
      metadata: { location: [{ value: { lat: 41.4, lon: -4.7, label: 'Segovia' } }] },
    };
    renderMap(jest.fn(), [rows[0]!, second], onSelectCluster);
    fireEvent.click(screen.getByRole('button', { name: 'cluster' }));
    const [sharedIds, modifiers] = onSelectCluster.mock.calls[0] as [
      string[],
      { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    ];
    expect(sharedIds).toEqual(expect.arrayContaining(['place-1', 'place-2']));
    expect(sharedIds).toHaveLength(2);
    expect(modifiers).toEqual({ shiftKey: false, ctrlKey: false, metaKey: false });
  });

  it('shows an empty state when there are no geolocated entities', () => {
    renderMap(jest.fn(), []);
    expect(screen.getByText('No entities found')).toBeInTheDocument();
    expect(screen.queryByTestId('library-map')).not.toBeInTheDocument();
  });
});
