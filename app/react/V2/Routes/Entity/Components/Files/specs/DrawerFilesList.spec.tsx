/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { EntityFileRow } from '../types.js';
import { DrawerFilesList } from '../DrawerFilesList.js';

const rows: { primaryRows: EntityFileRow[]; supportingRows: EntityFileRow[] } = {
  primaryRows: [],
  supportingRows: [],
};

jest.mock('../EntityFilesContext', () => ({
  useEntityFiles: () => ({
    primaryRows: rows.primaryRows,
    supportingRows: rows.supportingRows,
    mainDocumentId: undefined,
    saveRow: jest.fn(),
    requestAddFile: jest.fn(),
  }),
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../FilePreviewView', () => ({
  FilePreviewView: () => <div>preview</div>,
}));

jest.mock('../DrawerFileRow', () => ({
  DrawerFileRow: ({
    row,
    onView,
  }: {
    row: EntityFileRow;
    onView: (row: EntityFileRow) => void;
  }) => (
    <button type="button" onClick={() => onView(row)}>
      View {row.displayName}
    </button>
  ),
}));

const row = (overrides: Partial<EntityFileRow>): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'doc.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'EN',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  raw: { _id: '1', originalname: 'doc.pdf', filename: 'doc.pdf', fileType: 'document' },
  ...overrides,
});

describe('DrawerFilesList', () => {
  beforeEach(() => {
    rows.primaryRows = [];
    rows.supportingRows = [];
  });

  it('opens the preview modal from View', () => {
    rows.primaryRows = [row({})];
    render(<DrawerFilesList />);
    fireEvent.click(screen.getByRole('button', { name: 'View doc.pdf' }));
    expect(screen.getByRole('dialog', { name: 'doc.pdf' })).toBeInTheDocument();
  });

  it('opens a link in a new window', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    rows.supportingRows = [
      row({
        rowId: 'l1',
        displayName: 'Website',
        kind: 'link',
        fileType: 'externalURL',
        raw: {
          _id: '2',
          originalname: 'Website',
          url: 'https://example.com/doc',
          fileType: 'externalURL',
        },
      }),
    ];
    render(<DrawerFilesList />);
    fireEvent.click(screen.getByRole('button', { name: 'View Website' }));
    expect(open).toHaveBeenCalledWith('https://example.com/doc', '_blank', 'noopener,noreferrer');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
