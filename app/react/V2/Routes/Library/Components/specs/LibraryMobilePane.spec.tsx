/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryView } from '../LibraryView.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => true,
}));

jest.mock('../LibraryToolbar', () => ({
  LibraryToolbar: ({
    search,
    onSearchChange,
    onSearchSubmit,
  }: {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit?: (value: string) => void;
  }) => (
    <>
      <input
        aria-label="library search"
        value={search}
        onChange={event => onSearchChange(event.target.value)}
      />
      <button type="button" onClick={() => onSearchSubmit?.(search)}>
        submit search
      </button>
    </>
  ),
}));

jest.mock('../LibraryResultsFooter', () => ({
  LibraryResultsFooter: ({
    onCreateEntity,
    onOpenFilters,
    onShowResults,
  }: {
    onCreateEntity: () => void;
    onOpenFilters?: () => void;
    onShowResults?: () => void;
  }) => (
    <>
      <button type="button" onClick={onCreateEntity}>
        create entity
      </button>
      <button type="button" onClick={() => onOpenFilters?.()}>
        Filters
      </button>
      <button type="button" onClick={() => onShowResults?.()}>
        Results
      </button>
    </>
  ),
}));

jest.mock('../LibraryFilters', () => ({
  LibraryFilters: () => <div>filters body</div>,
}));

jest.mock('../LibraryEntityPreview', () => ({
  LibraryEntityPreview: ({ onClose }: { onClose: () => void }) => (
    <div>
      preview
      <button type="button" onClick={onClose}>
        close preview
      </button>
    </div>
  ),
}));

jest.mock('../LibraryCreateEntityPanel', () => ({
  LibraryCreateEntityPanel: () => <div>create body</div>,
}));

jest.mock('../Viewers/index', () => ({
  LibraryViewerHost: ({ onSelect }: { onSelect: (sharedId: string) => void }) => (
    <button type="button" onClick={() => onSelect('entity-1')}>
      select row
    </button>
  ),
}));

const aggregations = { templates: [], published: { published: 0, restricted: 0 }, properties: {} };

jest.mock('react-router', () => ({
  useRevalidator: () => ({ revalidate: () => undefined }),
}));

jest.mock('#V2/services/index.js', () => ({
  useServices: () => ({ entities: { delete: async () => [undefined, undefined] } }),
}));

const Harness = ({ onFiltersChange = () => undefined }: { onFiltersChange?: () => void }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  return (
    <>
      <span data-testid="selected-id">{selectedIds[0] ?? ''}</span>
      <LibraryView
        rows={[]}
        totalRows={0}
        aggregations={aggregations}
        search={search}
        committedSearch={search}
        onSearchChange={setSearch}
        view="cards"
        onViewChange={() => undefined}
        sort=""
        order="desc"
        onSortChange={() => undefined}
        filters={{ type: ['kept'] }}
        onFiltersChange={onFiltersChange}
        andFilters={[]}
        onAndFiltersChange={() => undefined}
        chips={[]}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onClosePreview={() => setSelectedIds([])}
        entityBasePath="/en/library"
        onLoadMore={() => undefined}
      />
    </>
  );
};

const expectHalfFilters = () => {
  const node = document.querySelector('[data-part="sheet"]');
  expect(node).toHaveAttribute('data-snap', 'half');
  expect(node).toHaveTextContent('filters body');
};

const sheets = () => document.querySelectorAll('[data-part="sheet"]');

const expectSnap = (text: string, snap: 'half' | 'full') => {
  const node = sheets()[sheets().length - 1];
  expect(node).toHaveAttribute('data-snap', snap);
  expect(node).toHaveTextContent(text);
};

const expectStackedOnFilters = (text: string) => {
  expect(sheets()).toHaveLength(2);
  expect(sheets()[0]).toHaveTextContent('filters body');
  expect(sheets()[0].getAttribute('style') ?? '').toContain('scale(0.97)');
  expectSnap(text, 'half');
};

const expectClosed = (onFiltersChange: jest.Mock) => {
  expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  expect(onFiltersChange).not.toHaveBeenCalled();
};

describe('LibraryView mobile sheets', () => {
  it('opens an entity on its own without filters', () => {
    const onFiltersChange = jest.fn();
    render(<Harness onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'select row' }));
    expect(sheets()).toHaveLength(1);
    expectSnap('preview', 'half');
    expect(sheets()[0]).not.toHaveTextContent('filters body');
    fireEvent.click(screen.getByRole('button', { name: 'close preview' }));
    expectClosed(onFiltersChange);
  });

  it('stacks an entity over filters that are already open', () => {
    const onFiltersChange = jest.fn();
    render(<Harness onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expectHalfFilters();
    fireEvent.click(screen.getByRole('button', { name: 'select row' }));
    expectStackedOnFilters('preview');
    fireEvent.click(screen.getByRole('button', { name: 'close preview' }));
    expectHalfFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Close Filters' }));
    expectClosed(onFiltersChange);
  });

  it('opens create at full height without filters', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'create entity' }));
    expect(sheets()).toHaveLength(1);
    expectSnap('create body', 'full');
    expect(sheets()[0]).not.toHaveTextContent('filters body');
  });

  it('clears the open entity when the sheet is dismissed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'select row' }));
    expectSnap('preview', 'half');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('selected-id')).toBeEmptyDOMElement();
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  });

  it('clears create mode when the sheet is dismissed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'create entity' }));
    expectSnap('create body', 'full');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('library-v2')).toHaveAttribute('data-mode', 'filters');
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  });

  it('opens the results sheet once when a search is submitted', () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole('textbox', { name: 'library search' }), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit search' }));
    expectSnap('No matches for', 'half');
    expect(sheets()[0]).toHaveTextContent('Results');

    fireEvent.click(screen.getByRole('button', { name: 'Close Results' }));
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'submit search' }));
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  });

  it('opens the results sheet from the footer', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Results' }));
    expectSnap('Search to see where terms match', 'half');
  });
});
