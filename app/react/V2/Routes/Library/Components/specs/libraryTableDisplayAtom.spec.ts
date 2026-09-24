/**
 * @jest-environment jsdom
 */
import { createElement } from 'react';
import { createStore, Provider, useAtom } from 'jotai';
import { cleanup, render, screen } from '@testing-library/react';
import {
  LIBRARY_TABLE_DISPLAY_STORAGE_KEY,
  libraryTableDisplayAtom,
} from '../libraryTableDisplayAtom.js';
import { DEFAULT_LIBRARY_TABLE_DISPLAY } from '../libraryTableColumns.js';

const TableDisplayProbe = () => {
  const [display] = useAtom(libraryTableDisplayAtom);
  return createElement('span', { 'data-testid': 'table-display' }, JSON.stringify(display));
};

const readMountedTableDisplay = () => {
  cleanup();
  const store = createStore();
  render(createElement(Provider, { store }, createElement(TableDisplayProbe)));
  return JSON.parse(screen.getByTestId('table-display').textContent || '');
};

describe('libraryTableDisplayAtom', () => {
  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('persists density and every column visibility choice', () => {
    const next = {
      density: 'comfortable' as const,
      hidden: ['title', 'template'],
      extraVisible: ['country::select::thesaurus::', 'role::multiselect::'],
    };

    createStore().set(libraryTableDisplayAtom, next);

    expect(
      JSON.parse(window.localStorage.getItem(LIBRARY_TABLE_DISPLAY_STORAGE_KEY) || '')
    ).toEqual(next);
    expect(readMountedTableDisplay()).toEqual(next);
  });

  it('falls back to the defaults when storage is invalid', () => {
    window.localStorage.setItem(LIBRARY_TABLE_DISPLAY_STORAGE_KEY, '{not-json');
    expect(readMountedTableDisplay()).toEqual(DEFAULT_LIBRARY_TABLE_DISPLAY);
  });
});
