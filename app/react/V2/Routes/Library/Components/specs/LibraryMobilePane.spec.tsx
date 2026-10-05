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
  LibraryToolbar: () => <div>toolbar</div>,
}));

jest.mock('../LibraryResultsFooter', () => ({
  LibraryResultsFooter: ({ onCreateEntity }: { onCreateEntity: () => void }) => (
    <button type="button" onClick={onCreateEntity}>
      create entity
    </button>
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
  return (
    <>
      <span data-testid="selected-id">{selectedIds[0] ?? ''}</span>
      <LibraryView
        rows={[]}
        totalRows={0}
        aggregations={aggregations}
        search=""
        onSearchChange={() => undefined}
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
});
