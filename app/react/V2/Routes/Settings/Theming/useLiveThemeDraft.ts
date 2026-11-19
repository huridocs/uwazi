import { useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import type { ClientSettings } from '#app/apiResponseTypes.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';

type SavedTheme = {
  themeVars: ClientSettings['themeVars'];
  themeAssets: ClientSettings['themeAssets'];
};

const themeValue = (record: Record<string, string | undefined> | undefined) =>
  Object.keys(record ?? {})
    .sort()
    .map(key => `${key}:${record?.[key] ?? ''}`)
    .join('|');

const assetValue = (assets: ClientSettings['themeAssets']) =>
  [
    assets?.preset,
    assets?.siteLogo?.light,
    assets?.siteLogo?.dark,
    assets?.favicon?.light,
    assets?.favicon?.dark,
  ]
    .map(part => part ?? '')
    .join('|');

const themeDraftChanged = (
  themeVars: ClientSettings['themeVars'],
  themeAssets: ClientSettings['themeAssets'],
  saved: SavedTheme
) =>
  themeValue(themeVars) !== themeValue(saved.themeVars) ||
  assetValue(themeAssets) !== assetValue(saved.themeAssets);

type LiveThemeDraft = {
  (next: SavedTheme): void;
  saved: () => SavedTheme;
};

const useLiveThemeDraft = (
  themeVars: ClientSettings['themeVars'],
  themeAssets: ClientSettings['themeAssets'],
  saved: SavedTheme
) => {
  const setSettings = useSetAtom(settingsAtom);
  const savedTheme = useRef(saved);
  useEffect(() => {
    setSettings(prev => ({ ...prev, themeVars, themeAssets }));
  }, [setSettings, themeAssets, themeVars]);
  useEffect(
    () => () => {
      const { themeVars: savedVars, themeAssets: savedAssets } = savedTheme.current;
      setSettings(prev => ({ ...prev, themeVars: savedVars, themeAssets: savedAssets }));
    },
    [setSettings]
  );
  const commitSavedTheme: LiveThemeDraft = Object.assign(
    (next: SavedTheme) => {
      savedTheme.current = next;
    },
    { saved: () => savedTheme.current }
  );
  return commitSavedTheme;
};

export { themeDraftChanged, useLiveThemeDraft };
export type { LiveThemeDraft, SavedTheme };
