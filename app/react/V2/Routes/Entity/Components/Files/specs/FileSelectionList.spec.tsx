/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { EntityFileRow } from '../types.js';
import { FileSelectionList } from '../FileSelectionList.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const row = (
  rowId: string,
  displayName: string,
  overrides: Partial<Pick<EntityFileRow, 'category' | 'fileType'>> = {}
): EntityFileRow => ({
  rowId,
  displayName,
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '213 KB',
  languageKey: 'English',
  modifiedLabel: '—',
  category: overrides.category ?? 'primary',
  fileType: overrides.fileType ?? 'document',
  raw: {
    fileType: overrides.fileType ?? 'document',
    originalname: displayName,
    mimetype: 'application/pdf',
  },
});

describe('FileSelectionList', () => {
  it('lists the selected files with a count', () => {
    render(
      <FileSelectionList
        rows={[row('a', 'Velasquez_Judgment_1988.pdf'), row('b', 'Velasquez_Sentence_1988.pdf')]}
      />
    );
    expect(screen.getByText('2 files selected')).toBeInTheDocument();
    expect(screen.getByText('Velasquez_Judgment_1988')).toBeInTheDocument();
    expect(screen.getAllByText('PDF · 213 KB · English')).toHaveLength(2);
  });

  it('omits language for a supporting file', () => {
    render(
      <FileSelectionList
        rows={[row('a', 'g2505275.pdf', { category: 'supporting', fileType: 'attachment' })]}
      />
    );
    expect(screen.getByText('PDF · 213 KB')).toBeInTheDocument();
    expect(screen.queryByText(/English/)).not.toBeInTheDocument();
  });
});
