/**
 * @jest-environment jsdom
 */
import { createElement } from 'react';
import { createStore, Provider, useAtom } from 'jotai';
import { cleanup, render, screen } from '@testing-library/react';
import {
  LIBRARY_CARD_DISPLAY_STORAGE_KEY,
  libraryCardDisplayAtom,
} from '../libraryCardDisplayAtom.js';
import { DEFAULT_LIBRARY_CARD_DISPLAY } from '../libraryCardDisplay.js';

const CardDisplayProbe = () => {
  const [display] = useAtom(libraryCardDisplayAtom);
  return createElement('span', { 'data-testid': 'card-display' }, JSON.stringify(display));
};

const readMountedCardDisplay = () => {
  cleanup();
  const store = createStore();
  render(createElement(Provider, { store }, createElement(CardDisplayProbe)));
  return JSON.parse(screen.getByTestId('card-display').textContent || '');
};

describe('libraryCardDisplayAtom', () => {
  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('persists thumbnail, metadata and frame choices', () => {
    const next = {
      showThumbnail: false,
      showMetadata: false,
      thumbFrame: 'landscape' as const,
      thumbSize: 'l' as const,
    };

    createStore().set(libraryCardDisplayAtom, next);

    expect(JSON.parse(window.localStorage.getItem(LIBRARY_CARD_DISPLAY_STORAGE_KEY) || '')).toEqual(
      next
    );
    expect(readMountedCardDisplay()).toEqual(next);
  });

  it('falls back to the defaults when storage is empty or invalid', () => {
    expect(readMountedCardDisplay()).toEqual(DEFAULT_LIBRARY_CARD_DISPLAY);

    window.localStorage.setItem(LIBRARY_CARD_DISPLAY_STORAGE_KEY, '{not-json');
    expect(readMountedCardDisplay()).toEqual(DEFAULT_LIBRARY_CARD_DISPLAY);

    window.localStorage.setItem(
      LIBRARY_CARD_DISPLAY_STORAGE_KEY,
      JSON.stringify({ showThumbnail: false, thumbFrame: 'square' })
    );
    expect(readMountedCardDisplay()).toEqual({
      showThumbnail: false,
      showMetadata: true,
      thumbFrame: 'portrait',
      thumbSize: 's',
    });
  });
});
