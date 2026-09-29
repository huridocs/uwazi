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

jest.mock('../LibraryUploadPdfModal', () => ({
  LibraryUploadPdfModal: () => null,
}));

jest.mock('../Viewers/index', () => ({
  LibraryViewerHost: ({ onSelect }: { onSelect: (sharedId: string) => void }) => (
    <button type="button" onClick={() => onSelect('entity-1')}>
      select row
    </button>
  ),
}));

const aggregations = { templates: [], published: { published: 0, restricted: 0 }, properties: {} };

const Harness = ({ onFiltersChange = () => undefined }: { onFiltersChange?: () => void }) => {
  const [selectedId, setSelectedId] = useState<string>();
  return (
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
      selectedId={selectedId}
      onSelect={setSelectedId}
      onClosePreview={() => setSelectedId(undefined)}
      entityBasePath="/en/library"
      onLoadMore={() => undefined}
    />
  );
};

const expectHalfFilters = () => {
  const node = document.querySelector('[data-part="sheet"]');
  expect(node).toHaveAttribute('data-snap', 'half');
  expect(node).toHaveTextContent('filters body');
};

const expectFull = (text: string) => {
  const node = document.querySelector('[data-part="sheet"]');
  expect(node).toHaveAttribute('data-snap', 'full');
  expect(node).toHaveTextContent(text);
};

const expectClosed = (onFiltersChange: jest.Mock) => {
  expect(document.querySelector('[data-part="sheet"]')).toBeNull();
  expect(onFiltersChange).not.toHaveBeenCalled();
};

describe('LibraryView mobile sheets', () => {
  it('opens filters at half height and a selected entity at full height', () => {
    const onFiltersChange = jest.fn();
    render(<Harness onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expectHalfFilters();
    fireEvent.click(screen.getByRole('button', { name: 'select row' }));
    expectFull('preview');
    fireEvent.click(screen.getByRole('button', { name: 'close preview' }));
    expectHalfFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expectClosed(onFiltersChange);
  });

  it('opens create at full height', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'create entity' }));
    expectFull('create body');
  });
});
