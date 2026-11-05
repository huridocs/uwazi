/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { EntityFileRow } from '../types.js';
import { FileSelectionList } from '../FileSelectionList.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const row = (rowId: string, displayName: string): EntityFileRow => ({
  rowId,
  displayName,
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '213 KB',
  languageKey: 'English',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  raw: { fileType: 'document', originalname: displayName },
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
});
