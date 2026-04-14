import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  BookOpenIcon,
  Cog6ToothIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { SiteName } from '#app/App/SiteName.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { settingsAtom, themeModeAtom, userAtom } from '../../../atoms/index.js';
import { LanguageDropdown } from './LanguageDropdown.js';
import { MenuLinks } from './MenuLinks.js';
import { MobileMenuDropdown } from './MobileMenuDropdown.js';

const libraryRoutes = new Set([
  '/library',
  '/library/map',
  '/library/table',
  'library',
  'library/map',
  'library/table',
]);

const isLibraryUrl = (url?: string) => {
  if (!url) return false;
  const [path] = url.split('?');
  return libraryRoutes.has(path);
};

const getLibraryUrl = (defaultLibraryView?: string) => {
  if (defaultLibraryView === 'map') return 'library/map';
  if (defaultLibraryView === 'table') return 'library/table';
  return 'library';
};

const Header = () => {
  const user = useAtomValue(userAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const authenticatedUser = Boolean(user?._id);
  const settings = useAtomValue(settingsAtom);
  const isMobile = useIsMobile();

  const { private: privateInstance, defaultLibraryView = 'cards', themeCustomization } = settings;
  const libraryUrl = getLibraryUrl(defaultLibraryView);
  const shouldShowLibrary = !privateInstance || authenticatedUser;
  const headerLinks = (settings.links ?? []).filter(link => !isLibraryUrl(link.url));

  return (
    <header className="header-bar flex flex-col" data-uwazi-header>
      <a
        href="#main"
        className="header-bar-skip sr-only focus:not-sr-only absolute top-2 left-2 z-50 rounded-md p-2 ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div className="flex min-h-[3.25rem] items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-3">
          {isMobile ? <MobileMenuDropdown links={headerLinks} /> : null}
          <SiteName
            className="header-bar-brand px-0 py-0 text-base font-semibold"
            textClassName="truncate"
            hideTextWhenLogo
          />
          {!isMobile ? <MenuLinks links={headerLinks} className="min-w-0 flex-wrap" /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageDropdown />
          <div
            className="header-bar-separator hidden h-8 w-px shrink-0 sm:block"
            aria-hidden="true"
          />
          {shouldShowLibrary && (
            <I18NLink
              to={libraryUrl}
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors"
              activeClassname="header-bar-button-active"
            >
              <BookOpenIcon className="h-4 w-4" />
              {!isMobile ? <Translate>Library</Translate> : null}
            </I18NLink>
          )}
          {authenticatedUser && (
            <I18NLink
              to="/settings/account"
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors"
              activeClassname="header-bar-button-active"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              {!isMobile ? <Translate>Settings</Translate> : null}
            </I18NLink>
          )}
          {!authenticatedUser && (
            <I18NLink
              to="/login"
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors"
            >
              <KeyIcon className="h-4 w-4" />
              {!isMobile ? <Translate>Sign in</Translate> : null}
            </I18NLink>
          )}
          {themeCustomization ? (
            <button
              type="button"
              className="header-bar-icon-button flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              aria-label={themeMode === 'light' ? 'Toggle dark theme' : 'Toggle light theme'}
              title={themeMode === 'light' ? 'Toggle dark theme' : 'Toggle light theme'}
            >
              {themeMode === 'light' ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
      <div className="nprogress-container" />
    </header>
  );
};

export { Header };
