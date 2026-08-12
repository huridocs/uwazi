/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DrawerFileRow } from '../DrawerFileRow.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('../FileThumbnail.js', () => ({
  FileThumbnail: () => <div data-testid="thumb" />,
}));

jest.mock('../ViewFileButton.js', () => ({
  ViewFileButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      View
    </button>
  ),
}));

jest.mock('../FileLanguageSelect.js', () => ({
  FileLanguageSelect: ({
    value,
    onChange,
    'aria-label': ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    'aria-label'?: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={e => onChange(e.target.value)}>
      <option value="eng">EN</option>
      <option value="other">other</option>
    </select>
  ),
}));

const buildRow = (overrides: Partial<EntityFileRow> = {}): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'doc.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'EN',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  status: 'ready',
  raw: {
    _id: 'file-1',
    originalname: 'doc.pdf',
    filename: 'doc.pdf',
    fileType: 'document',
    mimetype: 'application/pdf',
    language: 'eng',
  },
  ...overrides,
});

describe('DrawerFileRow', () => {
  it('commits trimmed name and language when save is clicked', async () => {
    const onCommit = jest.fn().mockResolvedValue(undefined);
    render(
      <DrawerFileRow
        row={buildRow()}
        editing
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={onCommit}
      />
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  renamed.pdf  ' } });
    fireEvent.click(screen.getByLabelText('Save'));

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith({
        _id: 'file-1',
        originalname: 'renamed.pdf',
        language: 'eng',
      });
    });
  });
});
