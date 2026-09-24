/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import {
  templates as fixtureTemplates,
  translations,
} from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { secondsToDate } from '#V2/shared/dateHelpers.js';
import { normalizeTimestamp } from '#V2/Components/Metadata/display/formatMetadataTimestamp.js';
import { TableViewer } from '../TableViewer.js';
import { libraryTableColumns } from '../../libraryTableColumns.js';

const templates = [
  {
    ...fixtureTemplates[0]!,
    properties: [
      { _id: 'p-geo', name: 'location', label: 'Location', type: 'geolocation' as const },
      { _id: 'p-media', name: 'video', label: 'Video', type: 'media' as const },
      { _id: 'p-type', name: 'type', label: 'Type', type: 'select' as const, filter: true },
    ],
  },
] as Template[];

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'org-1',
    language: 'en',
    title: 'Amnesty International',
    template: 'template1',
    creationDate: 1704067200000,
    editDate: 1735689600000,
    metadata: {
      location: [{ value: { lat: -35.9, lon: -65 }, label: '' }],
      video: [{ value: '/api/files/hearing.mp4' }],
      type: [{ value: 'ngo', label: 'NGO' }],
    },
  },
];

const visibleColumns = libraryTableColumns(templates, ['template1']).filter(column =>
  ['title', 'template', 'creationDate', 'editDate', 'location', 'video', 'type'].includes(column.id)
);

const renderTable = (
  overrides: {
    onSelect?: (sharedId: string) => void;
    onFocusProperty?: (sharedId: string, fieldKey: string) => void;
    onSortChange?: (sort: string, order: 'asc' | 'desc') => void;
    sort?: string;
    order?: 'asc' | 'desc';
    tableDensity?: 'comfortable' | 'compact';
  } = {}
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
        <TableViewer
          rows={rows}
          totalRows={1}
          onSelect={overrides.onSelect ?? (() => undefined)}
          onFocusProperty={overrides.onFocusProperty}
          entityBasePath="/entityv2"
          onLoadMore={() => undefined}
          showThumbnail
          showMetadata
          sort={overrides.sort}
          order={overrides.order}
          onSortChange={overrides.onSortChange}
          tableColumns={visibleColumns}
          tableDensity={overrides.tableDensity ?? 'compact'}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('TableViewer', () => {
  it('renders built-in columns and compact metadata', () => {
    renderTable();
    expect(screen.getByText('Amnesty International')).toBeInTheDocument();
    expect(screen.getByTestId('entity-type-chip')).toHaveAttribute('title', 'Documents');
    expect(
      screen.getByText(secondsToDate(normalizeTimestamp(1704067200000), 'en'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(secondsToDate(normalizeTimestamp(1735689600000), 'en'))
    ).toBeInTheDocument();
    expect(screen.getByText('NGO')).toBeInTheDocument();
    expect(screen.getByText('Latitude: -35.9, Longitude: -65')).toBeInTheDocument();
    expect(screen.getByText('hearing.mp4')).toBeInTheDocument();
  });

  it('opens preview from a row click and focuses a geolocation property from its link', () => {
    const onSelect = jest.fn();
    const onFocusProperty = jest.fn();
    renderTable({ onSelect, onFocusProperty });

    fireEvent.click(screen.getByText('Amnesty International'));
    expect(onSelect).toHaveBeenCalledWith('org-1', {
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Latitude: -35.9, Longitude: -65' }));
    expect(onFocusProperty).toHaveBeenCalledWith('org-1', 'location');
    fireEvent.click(screen.getByRole('button', { name: 'hearing.mp4' }));
    expect(onFocusProperty).toHaveBeenCalledWith('org-1', 'video');
  });

  it('uses compact row padding by default', () => {
    const { container } = renderTable();
    expect(container.querySelector('.min-h-8')).toBeTruthy();
    expect(container.querySelector('.min-h-11')).toBeFalsy();
  });

  it('sorts by creation date and edit date', () => {
    const onSortChange = jest.fn();
    renderTable({ onSortChange, sort: 'title', order: 'desc' });

    fireEvent.click(screen.getByRole('button', { name: 'Creation date' }));
    expect(onSortChange).toHaveBeenCalledWith('creationDate', 'asc');

    fireEvent.click(screen.getByRole('button', { name: 'Edit date' }));
    expect(onSortChange).toHaveBeenCalledWith('editDate', 'asc');
  });

  it('toggles the same column from ascending to descending', () => {
    const onSortChange = jest.fn();
    renderTable({ onSortChange, sort: 'creationDate', order: 'asc' });
    fireEvent.click(screen.getByRole('button', { name: 'Creation date' }));
    expect(onSortChange).toHaveBeenCalledWith('creationDate', 'desc');
  });

  it('sorts filterable select columns and leaves others unsortable', () => {
    const onSortChange = jest.fn();
    renderTable({ onSortChange, sort: 'title', order: 'desc' });

    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    expect(onSortChange).toHaveBeenCalledWith('metadata.type', 'asc');

    expect(screen.queryByRole('button', { name: 'Location' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Video' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Template' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connections' })).not.toBeInTheDocument();
  });
});
