import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { settingsAtom, themeModeAtom } from '../../../atoms/index.js';

const ThemeToggle = ({ labeled = false }: { labeled?: boolean }) => {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const settings = useAtomValue(settingsAtom);
  if (!settings.themeCustomization) return null;
  const label =
    themeMode === 'light'
      ? t('System', 'Toggle dark theme', null, false)
      : t('System', 'Toggle light theme', null, false);
  return (
    <button
      type="button"
      className="header-bar-icon-button flex h-9 items-center justify-center gap-2 rounded-md px-2 transition-colors"
      onClick={() => setThemeMode(mode => (mode === 'light' ? 'dark' : 'light'))}
      aria-label={label}
      title={label}
    >
      {themeMode === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
      {labeled ? label : null}
    </button>
  );
};

export { ThemeToggle };
