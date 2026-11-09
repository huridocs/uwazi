/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { LibraryRightPane, type LibraryRightPaneProps } from '../LibraryRightPane.js';

jest.mock('#UI/Icon/Icon.js', () => ({
  Icon: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('../LibraryEntityPreview', () => ({
  LibraryEntityPreview: () => <div>entity preview</div>,
}));

const templates = [
  {
    _id: 'tpl-causa',
    name: 'Causa',
    color: '#336699',
    properties: [{ _id: 'p1', name: 'resumen', label: 'Resumen', type: 'text' }],
  },
] as Template[];

const row = (): LibrarySearchHit => ({
  _id: '1',
  sharedId: 'case-1',
  title: 'Selvas Gómez',
  template: 'tpl-causa',
  language: 'es',
  creationDate: Date.UTC(2016, 0, 1),
  snippets: {
    count: 2,
    metadata: [{ field: 'metadata.resumen.value', texts: ['la <b>protesta</b>'] }],
    fullText: [{ text: 'víctimas <b>testigos</b>', page: 2 }],
  },
});

const aggregations = { templates: [], published: { published: 0, restricted: 0 }, properties: {} };

const paneProps = (overrides: Partial<LibraryRightPaneProps> = {}): LibraryRightPaneProps => ({
  creating: false,
  rows: [row()],
  selectedIds: [],
  selectionPanelOpen: false,
  entityBasePath: '/en/library',
  aggregations,
  filters: {},
  andFilters: [],
  chips: [],
  onFiltersChange: () => undefined,
  onAndFiltersChange: () => undefined,
  onClosePreview: () => undefined,
  onCloseSelection: () => undefined,
  onRemoveSelection: () => undefined,
  onPreviewSelection: () => undefined,
  onCreated: () => undefined,
  search: 'test',
  paneTab: 'results',
  onPaneTabChange: () => undefined,
  onFocusProperty: () => undefined,
  onSelectResult: () => undefined,
  onClearSearch: () => undefined,
  ...overrides,
});

const paneElement = (overrides: Partial<LibraryRightPaneProps> = {}) => {
  const props = paneProps(overrides);
  return (
    <TestAtomStoreProvider initialValues={[[templatesAtom, templates]]}>
      <LibraryRightPane
        creating={props.creating}
        rows={props.rows}
        selectedIds={props.selectedIds}
        selectionPanelOpen={props.selectionPanelOpen}
        entityBasePath={props.entityBasePath}
        aggregations={props.aggregations}
        filters={props.filters}
        andFilters={props.andFilters}
        chips={props.chips}
        onFiltersChange={props.onFiltersChange}
        onAndFiltersChange={props.onAndFiltersChange}
        onClosePreview={props.onClosePreview}
        onCloseSelection={props.onCloseSelection}
        onRemoveSelection={props.onRemoveSelection}
        onPreviewSelection={props.onPreviewSelection}
        onCreated={props.onCreated}
        search={props.search}
        paneTab={props.paneTab}
        onPaneTabChange={props.onPaneTabChange}
        onFocusProperty={props.onFocusProperty}
        onSelectResult={props.onSelectResult}
        onClearSearch={props.onClearSearch}
      />
    </TestAtomStoreProvider>
  );
};

const renderPane = (overrides: Partial<LibraryRightPaneProps> = {}) => {
  const view = render(paneElement(overrides));
  return {
    rerenderPane: (next: Partial<LibraryRightPaneProps>) => {
      view.rerender(paneElement({ ...overrides, ...next }));
    },
  };
};

const documentChip = () => screen.getByRole('button', { name: /Document/ });

const customizeResults = async () => {
  const user = userEvent.setup();
  await user.click(documentChip());
  await user.click(screen.getByRole('radio', { name: 'Passages' }));
};

const expectCustomResults = () => {
  expect(documentChip()).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('radio', { name: 'Passages' })).toBeChecked();
};

describe('LibraryRightPane results state', () => {
  it('keeps results filters and layout after opening and closing a result', async () => {
    const { rerenderPane } = renderPane();
    await customizeResults();
    expectCustomResults();

    rerenderPane({ selectedIds: ['case-1'] });
    expect(screen.getByText('entity preview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Document/ })).not.toBeInTheDocument();

    rerenderPane({ selectedIds: [] });
    expectCustomResults();
  });

  it('resets results filters when the search changes', async () => {
    const user = userEvent.setup();
    const { rerenderPane } = renderPane();
    await user.click(documentChip());
    expect(documentChip()).toHaveAttribute('aria-pressed', 'false');

    rerenderPane({ search: 'other' });
    expect(documentChip()).toHaveAttribute('aria-pressed', 'true');
  });
});
