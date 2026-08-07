/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FileDocumentContextBadge } from '../FileDocumentContextBadge.js';
import type { EntityFileRow } from '../types.js';

const mockSetFocusedRowId = jest.fn();
const mockRequestAddFile = jest.fn();
let mockPrimaryRows: EntityFileRow[] = [];

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../EntityFilesContext', () => ({
  useEntityFiles: () => ({
    mainDocumentId: 'main',
    primaryRows: mockPrimaryRows,
    setFocusedRowId: mockSetFocusedRowId,
    requestAddFile: mockRequestAddFile,
  }),
}));

const buildRow = (overrides: Partial<EntityFileRow>): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'doc.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'en',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  raw: { _id: '1', originalname: 'doc.pdf', filename: 'doc.pdf', fileType: 'document' },
  ...overrides,
});

describe('FileDocumentContextBadge', () => {
  beforeEach(() => {
    mockSetFocusedRowId.mockClear();
    mockRequestAddFile.mockClear();
  });

  it('does not render translation chips or add action for a supporting row', () => {
    mockPrimaryRows = [buildRow({ rowId: 'f1' })];
    const row = buildRow({ rowId: 's1', category: 'supporting' });

    render(<FileDocumentContextBadge row={row} />);

    expect(screen.queryByText('Add translation')).toBeNull();
  });

  it('does not render chips when there is a single primary row', () => {
    const row = buildRow({ rowId: 'f1' });
    mockPrimaryRows = [row];

    render(<FileDocumentContextBadge row={row} />);

    expect(screen.getByText('Add translation')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('renders chips for each primary row, highlights the current one, and switches focus on click', () => {
    const currentRow = buildRow({ rowId: 'f1', languageKey: 'en', displayName: 'doc-en.pdf' });
    const otherRow = buildRow({ rowId: 'f2', languageKey: 'es', displayName: 'doc-es.pdf' });
    mockPrimaryRows = [currentRow, otherRow];

    render(<FileDocumentContextBadge row={currentRow} />);

    expect(screen.getByText('doc-en.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc-es.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc-en.pdf').closest('button')).toBeNull();
    expect(screen.getByText('doc-es.pdf').closest('button')).not.toBeNull();

    fireEvent.click(screen.getByText('doc-es.pdf'));
    expect(mockSetFocusedRowId).toHaveBeenCalledWith('f2');
  });

  it('renders Active primary when the row is the ready main document', () => {
    const row = buildRow({
      rowId: 'main',
      raw: { _id: 'main', originalname: 'doc.pdf', filename: 'doc.pdf', fileType: 'document' },
    });
    mockPrimaryRows = [row];

    render(<FileDocumentContextBadge row={row} />);

    expect(screen.getByText('Active primary')).toBeInTheDocument();
  });

  it('renders Primary when the row is not the active main document', () => {
    const row = buildRow({
      rowId: 'other',
      raw: { _id: 'other', originalname: 'other.pdf', filename: 'other.pdf', fileType: 'document' },
    });
    mockPrimaryRows = [row];

    render(<FileDocumentContextBadge row={row} />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.queryByText('Active primary')).toBeNull();
  });

  it('requests a translation upload when clicking Add translation', () => {
    const row = buildRow({ rowId: 'f1' });
    mockPrimaryRows = [row];

    render(<FileDocumentContextBadge row={row} />);

    fireEvent.click(screen.getByText('Add translation'));
    expect(mockRequestAddFile).toHaveBeenCalledWith('translation');
  });
});
