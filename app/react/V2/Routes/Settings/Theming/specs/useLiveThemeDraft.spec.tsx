/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import type { ClientSettings } from '#app/apiResponseTypes.js';
import { useLiveThemeDraft } from '../useLiveThemeDraft.js';

const saved = {
  themeVars: { __preset: 'default' },
  themeAssets: { preset: 'default' as const },
};

describe('useLiveThemeDraft', () => {
  it('paints the draft and restores the saved theme on leave', () => {
    const store = createStore();
    store.set(settingsAtom, { site_name: 'Border', ...saved } as ClientSettings);
    const { rerender, unmount } = renderHook(
      ({ themeVars }) => useLiveThemeDraft(themeVars, saved.themeAssets, saved),
      {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        initialProps: { themeVars: saved.themeVars },
      }
    );
    rerender({ themeVars: { __preset: 'legacy' } });
    expect(store.get(settingsAtom).themeVars).toEqual({ __preset: 'legacy' });
    unmount();
    expect(store.get(settingsAtom).themeVars).toEqual(saved.themeVars);
    expect(store.get(settingsAtom).site_name).toBe('Border');
  });
});
