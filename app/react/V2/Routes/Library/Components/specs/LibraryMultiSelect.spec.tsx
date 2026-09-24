/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryViewMode } from '../../libraryUrlState.js';
import { LibraryView } from '../LibraryView.js';
import {
  clearSelection,
  clickCard,
  expectActionsMenu,
  expectCtrlPair,
  expectFooterChrome,
  expectFooterLabels,
  expectPanelRows,
  expectSingleEntity,
} from './libraryMultiSelectAssertions.js';

jest.mock('#app/Map/index.js', () => ({
  Map: ({
    markers = [],
    clickOnMarker,
    clickOnCluster,
  }: {
    markers?: { properties?: { entity?: { sharedId?: string } } }[];
    clickOnMarker?: (
      marker: { properties?: { entity?: { sharedId?: string } } },
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
    ) => void;
    clickOnCluster?: (
      cluster: { properties?: { entity?: { sharedId?: string } } }[],
      modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
    ) => void;
  }) => (
    <div data-testid="library-map">
      {markers.map((marker, index) => (
        <button
          key={marker.properties?.entity?.sharedId ?? `marker-${index}`}
          type="button"
          onClick={event =>
            clickOnMarker?.(marker, {
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
            })
          }
        >
          {`marker-${marker.properties?.entity?.sharedId}`}
        </button>
      ))}
      <button
        type="button"
        onClick={event =>
          clickOnCluster?.(markers, {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
          })
        }
      >
        cluster
      </button>
    </div>
  ),
}));

const templates = [
  {
    _id: 'country',
    name: 'Country',
    properties: [
      { _id: 'geo-country', name: 'location', label: 'Location', type: 'geolocation' },
      { _id: 'region', name: 'region', label: 'Region', type: 'select', showInCard: true },
      { _id: 'year', name: 'year', label: 'Year', type: 'numeric', showInCard: true },
    ],
  },
  {
    _id: 'case',
    name: 'Case',
    properties: [{ _id: 'geo-case', name: 'location', label: 'Location', type: 'geolocation' }],
  },
] as Template[];

const point = (lat: number, lon: number) => [{ value: { lat, lon, label: '' } }];

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'mexico',
    language: 'en',
    title: 'Mexico',
    template: 'country',
    metadata: {
      location: point(19.4, -99.1),
      region: [{ value: 'americas', label: 'Americas · North America' }],
      year: [{ value: 1981 }],
    },
  },
  {
    _id: '2',
    sharedId: 'ellacuria',
    language: 'en',
    title: 'Case 10.488 (Ellacuría)',
    template: 'case',
    metadata: { location: point(13.7, -89.2) },
  },
  {
    _id: '3',
    sharedId: 'gelman',
    language: 'en',
    title: 'Case 11.481 (Gelman)',
    template: 'case',
    metadata: { location: point(-34.6, -58.4) },
  },
];

const aggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
};

const previewEntity = (sharedId: string): Entity | undefined => {
  const row = rows.find(item => item.sharedId === sharedId);
  if (!row) {
    return undefined;
  }
  return {
    _id: row._id,
    sharedId: row.sharedId,
    title: row.title,
    template: row.template,
    language: row.language,
    creationDate: 0,
    user: 'user1',
    documents: [],
    metadata: {},
  };
};

const getBySharedId: EntitiesService['getBySharedId'] = async sharedId => {
  const entity = previewEntity(sharedId);
  return entity ? [[entity]] : [undefined];
};

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

let mediaMock = setupMatchMediaMock();

const Harness = ({ view }: { view: LibraryViewMode }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <LibraryView
      rows={rows}
      totalRows={rows.length}
      aggregations={aggregations}
      search=""
      onSearchChange={() => undefined}
      view={view}
      onViewChange={() => undefined}
      sort=""
      order="desc"
      onSortChange={() => undefined}
      filters={{}}
      onFiltersChange={() => undefined}
      andFilters={[]}
      onAndFiltersChange={() => undefined}
      chips={[]}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      onClosePreview={() => setSelectedIds([])}
      entityBasePath="/entityv2"
      onLoadMore={() => undefined}
    />
  );
};

const renderLibrary = (view: LibraryViewMode) =>
  render(
    <TestRouterContext>
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [translationsAtom, translations],
            [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
            [userAtom, { _id: 'admin1', role: 'admin', username: 'admin', email: 'a@b.c' }],
          ]}
        >
          <Harness view={view} />
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );

const ready = async (text: string) => screen.findByText(text);

describe('library multi-select', () => {
  afterEach(() => {
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  it('shows one entity on a plain click and the multi-select chrome only for a range', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    clickCard('Gelman', { shiftKey: true });
    expectPanelRows();
    expectFooterLabels();
    expectFooterChrome();
    expectActionsMenu();
    clearSelection();
  });

  it('toggles entities with ctrl or cmd', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    clickCard('Gelman', { ctrlKey: true });
    expectCtrlPair();
    clickCard('Mexico', { metaKey: true });
    await expectSingleEntity('Case 11.481 (Gelman)');
  });

  it('selects a table range with shift', async () => {
    renderLibrary('table');
    fireEvent.click(await ready('Mexico'));
    fireEvent.click(screen.getByText('Case 11.481 (Gelman)'), { shiftKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent(
      'Case 10.488 (Ellacuría)'
    );
  });

  it('closes the selection list without clearing, then clears from the footer', async () => {
    renderLibrary('table');
    fireEvent.click(await ready('Mexico'));
    fireEvent.click(screen.getByText('Case 11.481 (Gelman)'), { shiftKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('library-selected-count')).toHaveTextContent('3 selected');
    fireEvent.click(screen.getByTestId('library-selected-count'));
    expect(screen.getByTestId('library-selection-panel')).toBeInTheDocument();
    clearSelection();
  });

  it('selects every entity in a map cluster and toggles markers with ctrl', async () => {
    renderLibrary('map');
    fireEvent.click(await screen.findByRole('button', { name: 'cluster' }));
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent('Mexico');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent('Case 11.481 (Gelman)');

    fireEvent.click(screen.getByRole('button', { name: 'Close selection list' }));
    fireEvent.click(screen.getByRole('button', { name: 'marker-mexico' }));
    fireEvent.click(screen.getByRole('button', { name: 'marker-ellacuria' }), { ctrlKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('2 entities');
    expect(screen.getByTestId('library-selection-panel')).not.toHaveTextContent('Gelman');
  });
});
