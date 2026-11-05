/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { EntityFileRow } from '../../../Components/Files/types.js';
import { FilesTab } from '../FilesTab.js';

const mockShowSidePane = jest.fn();
const mockOpenFilePreviewForRow = jest.fn();
const mockNavigateToFilesSideTab = jest.fn();

const fileRow = (kind: EntityFileRow['kind'], url?: string): EntityFileRow => ({
  rowId: 'f1',
  displayName: kind === 'link' ? 'Website' : 'doc.pdf',
  kind,
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'en',
  modifiedLabel: '—',
  category: 'primary',
  fileType: kind === 'link' ? 'externalURL' : 'document',
  raw: { fileType: kind === 'link' ? 'externalURL' : 'document', url },
});

let mockRows: EntityFileRow[] = [];

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/Files/EntityFilesContext.js', () => ({
  useEntityFiles: () => ({
    primaryRows: mockRows,
    supportingRows: [],
    focusedRow: undefined,
    selectedRowIds: [],
    setFocusedRowId: jest.fn(),
    setSelectedRowIds: jest.fn(),
    navigateToFilesSideTab: mockNavigateToFilesSideTab,
    openFilePreviewForRow: mockOpenFilePreviewForRow,
    openFileEdit: jest.fn(),
    requestDeleteRow: jest.fn(),
  }),
}));

jest.mock('#V2/Routes/Entity/Tabs/EntityTabsContext.js', () => ({
  useEntityTabNavigation: () => ({ showSidePane: mockShowSidePane }),
}));

jest.mock('#V2/Routes/Entity/Components/Files/FilesTableSection.js', () => ({
  FilesTableSection: ({
    rows: sectionRows,
    onViewRow,
    onSelectRows,
  }: {
    rows: EntityFileRow[];
    onViewRow: (row: EntityFileRow) => void;
    onSelectRows: (ids: string[]) => void;
  }) => (
    <>
      {sectionRows[0] ? (
        <button type="button" onClick={() => onViewRow(sectionRows[0])}>
          View row
        </button>
      ) : null}
      <button type="button" onClick={() => onSelectRows(['a', 'b'])}>
        Select two
      </button>
    </>
  ),
}));

describe('FilesTab view', () => {
  beforeEach(() => {
    mockShowSidePane.mockClear();
    mockOpenFilePreviewForRow.mockClear();
    mockNavigateToFilesSideTab.mockClear();
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('opens the side pane when viewing a file', () => {
    mockRows = [fileRow('pdf')];
    render(<FilesTab />);
    fireEvent.click(screen.getByRole('button', { name: 'View row' }));
    expect(mockOpenFilePreviewForRow).toHaveBeenCalledWith('f1');
    expect(mockNavigateToFilesSideTab).toHaveBeenCalledWith('file');
    expect(mockShowSidePane).toHaveBeenCalled();
  });

  it('opens the side pane when more than one file is selected', () => {
    mockRows = [fileRow('pdf')];
    render(<FilesTab />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Select two' })[0]);
    expect(mockNavigateToFilesSideTab).toHaveBeenCalledWith('file');
    expect(mockShowSidePane).toHaveBeenCalled();
  });

  it('opens a link in a new window', () => {
    mockRows = [fileRow('link', 'https://example.com/doc')];
    render(<FilesTab />);
    fireEvent.click(screen.getByRole('button', { name: 'View row' }));
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/doc',
      '_blank',
      'noopener,noreferrer'
    );
    expect(mockOpenFilePreviewForRow).not.toHaveBeenCalled();
    expect(mockShowSidePane).not.toHaveBeenCalled();
  });
});
