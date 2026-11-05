/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileDetailsEditor } from '../FileDetailsEditor.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('#V2/Routes/Entity/Components/Files/FileDocumentContextBadge.js', () => ({
  FileDocumentContextBadge: () => null,
}));

jest.mock('#V2/Routes/Entity/Components/Files/FileDeleteAction.js', () => ({
  FileDeleteAction: () => null,
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  LanguageSelect: ({ 'aria-label': ariaLabel }: { 'aria-label'?: string }) => (
    <button type="button" aria-label={ariaLabel}>
      other
    </button>
  ),
}));

const buildRow = (category: EntityFileRow['category']): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'g2505275.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '171 KB',
  languageKey: 'other',
  modifiedLabel: '—',
  category,
  fileType: 'attachment',
  status: 'ready',
  raw: {
    _id: 'file-1',
    originalname: 'g2505275.pdf',
    filename: 'g2505275.pdf',
    fileType: 'attachment',
    mimetype: 'application/pdf',
    language: 'other',
  },
});

describe('FileDetailsEditor', () => {
  it('keeps the language field for a primary document', () => {
    render(<FileDetailsEditor row={buildRow('primary')} onSave={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'File language' })).toBeInTheDocument();
  });

  it('hides the language field for a supporting file', () => {
    render(<FileDetailsEditor row={buildRow('supporting')} onSave={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'File language' })).not.toBeInTheDocument();
  });
});
