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
import { LibraryResultsPanel } from '../LibraryResultsPanel.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

const templates = [
  {
    _id: 'tpl-causa',
    name: 'Causa',
    color: '#336699',
    properties: [{ _id: 'p1', name: 'resumen', label: 'Resumen', type: 'text' }],
  },
] as Template[];

const row = (overrides: Partial<LibrarySearchHit> = {}): LibrarySearchHit => ({
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
  ...overrides,
});

const renderPanel = (search = 'test', rows: LibrarySearchHit[] = [row()]) => {
  const onFocusProperty = jest.fn();
  const onSelect = jest.fn();
  const onClearSearch = jest.fn();
  render(
    <TestAtomStoreProvider initialValues={[[templatesAtom, templates]]}>
      <LibraryResultsPanel
        search={search}
        rows={rows}
        onFocusProperty={onFocusProperty}
        onSelect={onSelect}
        onClearSearch={onClearSearch}
      />
    </TestAtomStoreProvider>
  );
  return { onFocusProperty, onSelect, onClearSearch };
};

describe('LibraryResultsPanel', () => {
  it('asks for a search when the box is empty', () => {
    renderPanel('', [row()]);
    expect(screen.getByText('Search to see where terms match')).toBeInTheDocument();
    expect(screen.queryByText('Selvas Gómez')).not.toBeInTheDocument();
  });

  it('lists property and document snippets for the loaded rows', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: /Properties/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Document/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Title/ })).toHaveTextContent('0');
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('protesta')).toBeInTheDocument();
    expect(screen.getByText('testigos')).toBeInTheDocument();
    expect(screen.queryByText('2016')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-type-chip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selvas Gómez' })).not.toHaveTextContent('2016');
  });

  it('focuses a property and selects the document passage', async () => {
    const user = userEvent.setup();
    const { onFocusProperty, onSelect } = renderPanel();

    await user.click(screen.getByRole('button', { name: /protesta/ }));
    expect(onFocusProperty).toHaveBeenCalledWith('case-1', 'resumen');

    await user.click(screen.getByRole('button', { name: /testigos/ }));
    expect(onSelect).toHaveBeenCalledWith('case-1');
  });

  it('hides document passages when that chip is off', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: /Document/ }));
    expect(screen.queryByText('testigos')).not.toBeInTheDocument();
    expect(screen.getByText('protesta')).toBeInTheDocument();
  });

  it('folds grouped cards and expands them again', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('protesta')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('protesta')).toBeInTheDocument();
  });

  it('lists passages as one flat list', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('radio', { name: 'Passages' }));
    expect(screen.getByRole('button', { name: /testigos/ })).toHaveTextContent('Selvas Gómez');
    expect(screen.getByRole('button', { name: /protesta/ })).toHaveTextContent('Resumen');
  });

  it('offers to clear a search that matched nothing', async () => {
    const user = userEvent.setup();
    const { onClearSearch } = renderPanel('test', []);

    expect(screen.getByText(/No matches for/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearSearch).toHaveBeenCalled();
  });

  describe('offscreen rows', () => {
    const originalObserver = global.IntersectionObserver;
    const manyRows = Array.from({ length: 16 }, (_, index) =>
      row({
        _id: String(index),
        sharedId: `case-${index}`,
        title: `Case ${index}`,
        snippets: {
          count: 1,
          metadata: [{ field: 'metadata.resumen.value', texts: [`match ${index}`] }],
          fullText: [],
        },
      })
    );

    beforeEach(() => {
      global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: () => undefined,
        unobserve: () => undefined,
        disconnect: () => undefined,
        takeRecords: () => [],
        root: null,
        rootMargin: '',
        thresholds: [],
      }));
    });

    afterEach(() => {
      global.IntersectionObserver = originalObserver;
    });

    it('renders the first grouped cards and leaves the rest as placeholders', () => {
      renderPanel('test', manyRows);
      expect(screen.getByText('Case 0')).toBeInTheDocument();
      expect(screen.queryByText('Case 15')).not.toBeInTheDocument();
    });

    it('renders the first passages and leaves the rest as placeholders', async () => {
      const user = userEvent.setup();
      renderPanel('test', manyRows);
      await user.click(screen.getByRole('radio', { name: 'Passages' }));
      expect(screen.getByText(/match 0/)).toBeInTheDocument();
      expect(screen.queryByText(/match 15/)).not.toBeInTheDocument();
    });
  });
});
