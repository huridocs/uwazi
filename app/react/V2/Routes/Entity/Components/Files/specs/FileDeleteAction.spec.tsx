/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FileDeleteAction } from '../FileDeleteAction.js';
import type { EntityFileRow } from '../types.js';

const mockRequestDeleteRow = jest.fn();

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../EntityFilesContext', () => ({
  useEntityFiles: () => ({
    requestDeleteRow: mockRequestDeleteRow,
  }),
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

const buildRow = (overrides: Partial<EntityFileRow> = {}): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'doc.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'en',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  status: 'ready',
  raw: { _id: '1', originalname: 'doc.pdf', filename: 'doc.pdf', fileType: 'document' },
  ...overrides,
});

describe('FileDeleteAction', () => {
  beforeEach(() => {
    mockRequestDeleteRow.mockClear();
  });

  it('renders nothing while the file is processing', () => {
    const { container } = render(<FileDeleteAction row={buildRow({ status: 'processing' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('requests delete when Delete file is clicked', () => {
    const row = buildRow();
    render(<FileDeleteAction row={row} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete file' }));
    expect(mockRequestDeleteRow).toHaveBeenCalledWith(row);
  });
});
