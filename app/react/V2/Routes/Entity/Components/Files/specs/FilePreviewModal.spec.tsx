/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FilePreviewModal } from '../FilePreviewModal.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/Files/FilePreviewView.js', () => ({
  FilePreviewView: () => null,
}));

jest.mock('#V2/Routes/Entity/Tabs/footers/FileDownloadButton.js', () => ({
  FileDownloadButton: () => null,
  fileDownloadUrl: () => '',
}));

const buildRow = (overrides: Partial<EntityFileRow> = {}): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '213 KB',
  languageKey: 'English',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  status: 'ready',
  raw: {
    _id: 'file-1',
    originalname: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988.pdf',
    filename: 'doc.pdf',
    fileType: 'document',
    mimetype: 'application/pdf',
    language: 'eng',
  },
  ...overrides,
});

describe('FilePreviewModal', () => {
  it('shows the name with type, size, and language for a primary document', () => {
    render(<FilePreviewModal row={buildRow()} onClose={jest.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988' })
    ).toBeInTheDocument();
    expect(screen.getByText('PDF · 213 KB · English')).toBeInTheDocument();
  });

  it('shows type and size without a language for a supporting file', () => {
    render(
      <FilePreviewModal
        row={buildRow({
          displayName: 'g2505275.pdf',
          category: 'supporting',
          sizeLabel: '171 KB',
          languageKey: 'other',
          raw: {
            _id: 'file-2',
            originalname: 'g2505275.pdf',
            filename: 'g.pdf',
            fileType: 'attachment',
            mimetype: 'application/pdf',
            language: 'other',
          },
        })}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'g2505275' })).toBeInTheDocument();
    expect(screen.getByText('PDF · 171 KB')).toBeInTheDocument();
    expect(screen.queryByText(/other/)).not.toBeInTheDocument();
  });
});
