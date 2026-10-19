/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryView } from '../LibraryView.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => false,
}));

jest.mock('../LibraryToolbar', () => ({
  LibraryToolbar: ({
    search,
    onSearchSubmit,
  }: {
    search: string;
    onSearchSubmit?: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onSearchSubmit?.(search)}>
      submit search
    </button>
  ),
}));

jest.mock('../LibraryResultsFooter', () => ({
  LibraryResultsFooter: () => <div>footer</div>,
}));

jest.mock('../LibraryFilters', () => ({
  LibraryFilters: () => <div>filters body</div>,
}));

jest.mock('../LibraryResultsPanel', () => ({
  LibraryResultsPanel: ({ search }: { search: string }) => <div>results body {search}</div>,
}));

jest.mock('../LibraryEntityPreview', () => ({
  LibraryEntityPreview: () => <div>entity preview</div>,
}));

jest.mock('../Viewers/index', () => ({
  LibraryViewerHost: () => <div>library rows</div>,
}));

jest.mock('react-router', () => ({
  useRevalidator: () => ({ revalidate: () => undefined }),
}));

jest.mock('#V2/services/index.js', () => ({
  useServices: () => ({ entities: { delete: async () => [undefined, undefined] } }),
}));

const aggregations = { templates: [], published: { published: 0, restricted: 0 }, properties: {} };

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as unknown as typeof ResizeObserver;

const Harness = ({
  committedSearch,
  selectedIds = [],
  onSelectedIdsChange = () => undefined,
}: {
  committedSearch: string;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
}) => (
  <LibraryView
    rows={[]}
    totalRows={0}
    aggregations={aggregations}
    search={committedSearch}
    committedSearch={committedSearch}
    onSearchChange={() => undefined}
    view="cards"
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
    onSelectedIdsChange={onSelectedIdsChange}
    onClosePreview={() => undefined}
    entityBasePath="/en/library"
  />
);

describe('LibraryView results tab', () => {
  it('shows filters until a search is committed', () => {
    const { rerender } = render(<Harness committedSearch="" />);
    expect(screen.getByRole('tab', { name: 'Filters' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tablist', { name: 'Library side panel' })).toHaveClass('rounded-md');
    expect(screen.getByText('filters body')).toBeInTheDocument();

    rerender(<Harness committedSearch="test" />);
    expect(screen.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('results body test')).toBeInTheDocument();
  });

  it('stays on filters until the committed search changes', () => {
    const { rerender } = render(<Harness committedSearch="test" />);
    fireEvent.click(screen.getByRole('tab', { name: 'Filters' }));
    expect(screen.getByText('filters body')).toBeInTheDocument();

    rerender(<Harness committedSearch="test" />);
    expect(screen.getByText('filters body')).toBeInTheDocument();

    rerender(<Harness committedSearch="other" />);
    expect(screen.getByText('results body other')).toBeInTheDocument();

    rerender(<Harness committedSearch="" />);
    expect(screen.getByText('filters body')).toBeInTheDocument();
  });

  it('closes the open entity when a search is committed', () => {
    const onSelectedIdsChange = jest.fn();
    const { rerender } = render(
      <Harness
        committedSearch=""
        selectedIds={['entity-1']}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );
    expect(screen.getByText('entity preview')).toBeInTheDocument();
    expect(onSelectedIdsChange).not.toHaveBeenCalled();

    rerender(
      <Harness
        committedSearch="egg"
        selectedIds={['entity-1']}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );
    expect(onSelectedIdsChange).toHaveBeenCalledWith([]);
  });

  it('keeps the open entity when the search is cleared', () => {
    const onSelectedIdsChange = jest.fn();
    const { rerender } = render(
      <Harness
        committedSearch="egg"
        selectedIds={['entity-1']}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );

    rerender(
      <Harness
        committedSearch=""
        selectedIds={['entity-1']}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );
    expect(onSelectedIdsChange).not.toHaveBeenCalled();
    expect(screen.getByText('entity preview')).toBeInTheDocument();
  });

  it('closes the open entity when the current search is submitted again', () => {
    const onSelectedIdsChange = jest.fn();
    render(
      <Harness
        committedSearch="egg"
        selectedIds={['entity-1']}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'submit search' }));
    expect(onSelectedIdsChange).toHaveBeenCalledWith([]);
  });
});
