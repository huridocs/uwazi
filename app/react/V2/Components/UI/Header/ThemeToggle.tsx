import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { settingsAtom, themeModeAtom } from '../../../atoms/index.js';
import { HeaderIcon } from './headerIcons.js';

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
      <HeaderIcon name={themeMode === 'light' ? 'moon' : 'sun'} />
      {labeled ? label : null}
    </button>
  );
};

export { ThemeToggle };
