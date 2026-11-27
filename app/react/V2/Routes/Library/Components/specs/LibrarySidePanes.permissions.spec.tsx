/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { librarySidePanes } from '../LibrarySidePanes.js';

const aggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
  permissions: {
    read: [{ id: 'user1', label: 'afarah', count: 4, group: false }],
    write: [],
  },
};

const renderDesktopFilters = (onPermissionFiltersChange = jest.fn()) => {
  const panes = librarySidePanes({
    isMobile: false,
    filtersOpen: false,
    resultsOpen: false,
    onFiltersDismiss: () => undefined,
    onResultsDismiss: () => undefined,
    requestPane: () => undefined,
    creating: false,
    rows: [],
    selectedIds: [],
    selectionPanelOpen: false,
    entityBasePath: '/en/library',
    aggregations,
    filters: {},
    andFilters: [],
    permissionFilters: [],
    permissionsAnd: false,
    chips: [],
    onFiltersChange: () => undefined,
    onAndFiltersChange: () => undefined,
    onPermissionFiltersChange,
    onPermissionsAndChange: () => undefined,
    onClearFilters: () => undefined,
    onClosePreview: () => undefined,
    onCloseSelection: () => undefined,
    onRemoveSelection: () => undefined,
    onPreviewSelection: () => undefined,
    onCreated: () => undefined,
    search: '',
    paneTab: 'filters',
    onPaneTabChange: () => undefined,
    onFocusProperty: () => undefined,
    onSelectResult: () => undefined,
    onClearSearch: () => undefined,
  });

  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, []],
        [translationsAtom, translations],
        [settingsAtom, {}],
        [userAtom, { _id: 'admin1', role: 'admin', username: 'admin' }],
      ]}
    >
      {panes}
    </TestAtomStoreProvider>
  );
  return onPermissionFiltersChange;
};

describe('desktop library filters', () => {
  it('selects a permission checkbox', async () => {
    const user = userEvent.setup();
    const onPermissionFiltersChange = renderDesktopFilters();

    await user.click(screen.getByRole('checkbox', { name: /afarah/ }));

    expect(onPermissionFiltersChange).toHaveBeenCalledWith([{ level: 'read', refId: 'user1' }]);
  });
});
