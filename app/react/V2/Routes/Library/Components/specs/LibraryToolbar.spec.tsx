/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import { LibraryTableDisplayOptions, VIEW_OPTIONS } from '../LibraryToolbar.js';
import { LibraryCardsDisplayOptions } from '../LibraryCardsDisplayOptions.js';
import {
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  libraryTableColumnGroups,
  libraryTableColumns,
  toggleColumnVisibility,
  type LibraryTableDisplayState,
} from '../libraryTableColumns.js';

const tableColumns = libraryTableColumns(templates, ['template1']);
const groupingTemplates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    color: '#6a5acd',
    properties: [
      { _id: 'p1', name: 'country', label: 'Country', type: 'select', content: 'c' },
      { _id: 'p2', name: 'type', label: 'Type', type: 'select', content: 't' },
    ],
  },
  {
    _id: 'tpl-person',
    name: 'Person',
    color: '#faca15',
    properties: [
      { _id: 'p3', name: 'country', label: 'Country', type: 'select', content: 'c' },
      { _id: 'p4', name: 'role', label: 'Role', type: 'text' },
    ],
  },
] as Template[];

describe('LibraryToolbar view options', () => {
  it('offers cards, map and table only', () => {
    expect(VIEW_OPTIONS.map(option => option.value)).toEqual(['cards', 'map', 'table']);
  });
});

describe('LibraryTableDisplayOptions', () => {
  it('toggles columns and density', () => {
    const onToggleColumn = jest.fn();
    const onDensityChange = jest.fn();
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <LibraryTableDisplayOptions
          columns={tableColumns}
          display={DEFAULT_LIBRARY_TABLE_DISPLAY}
          onToggleColumn={onToggleColumn}
          onDensityChange={onDensityChange}
        />
      </TestAtomStoreProvider>
    );
    expect(screen.getByText('Columns')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Title' }));
    expect(onToggleColumn).toHaveBeenCalledWith('title');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Comfortable/ }));
    expect(onDensityChange).toHaveBeenCalledWith('comfortable');
  });

  it('lists every template property and checks equal properties together', () => {
    const InteractiveOptions = () => {
      const [display, setDisplay] = useState<LibraryTableDisplayState>(
        DEFAULT_LIBRARY_TABLE_DISPLAY
      );
      return (
        <LibraryTableDisplayOptions
          columns={libraryTableColumns(groupingTemplates, ['tpl-org', 'tpl-person'])}
          groups={libraryTableColumnGroups(groupingTemplates, ['tpl-org', 'tpl-person'])}
          display={display}
          onToggleColumn={id => setDisplay(current => toggleColumnVisibility(id, current))}
        />
      );
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, groupingTemplates],
          [translationsAtom, translations],
        ]}
      >
        <InteractiveOptions />
      </TestAtomStoreProvider>
    );

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
    const countryChecks = screen.getAllByRole('menuitemcheckbox', { name: 'Country' });
    expect(countryChecks).toHaveLength(2);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Role' })).toBeInTheDocument();

    fireEvent.click(countryChecks[0]!);
    screen.getAllByRole('menuitemcheckbox', { name: 'Country' }).forEach(checkbox => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  });
});

describe('LibraryCardsDisplayOptions', () => {
  const renderCardsOptions = (showThumbnail = true) => {
    const onThumbFrameChange = jest.fn();
    const onThumbFitChange = jest.fn();
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <LibraryCardsDisplayOptions
          showThumbnail={showThumbnail}
          showMetadata
          onShowThumbnailChange={() => undefined}
          onShowMetadataChange={() => undefined}
          thumbFrame="landscape"
          onThumbFrameChange={onThumbFrameChange}
          thumbFit="auto"
          onThumbFitChange={onThumbFitChange}
        />
      </TestAtomStoreProvider>
    );
    return { onThumbFrameChange, onThumbFitChange };
  };

  it('offers landscape, portrait, auto, cover and contain while thumbnails are on', () => {
    const { onThumbFrameChange, onThumbFitChange } = renderCardsOptions();
    expect(screen.getByRole('menuitemcheckbox', { name: /Landscape/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Portrait/ }));
    expect(onThumbFrameChange).toHaveBeenCalledWith('portrait');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Cover/ }));
    expect(onThumbFitChange).toHaveBeenCalledWith('cover');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Contain/ }));
    expect(onThumbFitChange).toHaveBeenCalledWith('contain');
  });

  it('hides frame and fit when thumbnails are off', () => {
    renderCardsOptions(false);
    expect(screen.queryByRole('menuitemcheckbox', { name: /Landscape/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemcheckbox', { name: /Cover/ })).not.toBeInTheDocument();
  });
});
