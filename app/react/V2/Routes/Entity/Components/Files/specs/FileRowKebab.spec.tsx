/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FileRowKebab, getThemedPortalRoot } from '../FileRowKebab.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityWriteAuthorized: () => true,
}));

const row: EntityFileRow = {
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
};

describe('getThemedPortalRoot', () => {
  it('prefers the nearest .tw-content ancestor', () => {
    const root = document.createElement('div');
    root.className = 'tw-content';
    const child = document.createElement('button');
    root.appendChild(child);
    document.body.appendChild(root);

    expect(getThemedPortalRoot(child)).toBe(root);
    root.remove();
  });
});

describe('FileRowKebab', () => {
  it('portals the menu into .tw-content and closes on Escape', () => {
    const themed = document.createElement('div');
    themed.className = 'tw-content';
    document.body.appendChild(themed);

    render(
      <FileRowKebab
        row={row}
        onView={jest.fn()}
        onRename={jest.fn()}
        onChangeLanguage={jest.fn()}
        onDelete={jest.fn()}
        showLanguageAction={false}
      />,
      { container: themed }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    const menu = screen.getByRole('menu');
    expect(themed.contains(menu)).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();

    themed.remove();
  });
});
