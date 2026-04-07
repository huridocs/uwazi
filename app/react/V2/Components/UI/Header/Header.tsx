import React from 'react';
import { useAtomValue } from 'jotai';
import { BookOpenIcon, Cog6ToothIcon, KeyIcon } from '@heroicons/react/24/outline';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { userAtom, settingsAtom } from '../../../atoms/index.js';
import { LanguageDropdown } from './LanguageDropdown.js';
import { MenuLinks } from './MenuLinks.js';

// No props needed - using Jotai atoms directly

const Header = () => {
  const user = useAtomValue(userAtom);
  const authenticatedUser = Boolean(user?._id);
  const settings = useAtomValue(settingsAtom);

  // Extract settings
  const { private: privateInstance, defaultLibraryView = 'cards' } = settings;

  //defaultLibraryView can be cards map or table
  const libraryView = {
    cards: 'library',
    map: 'library/map',
    table: 'library/table',
  };

  const libraryUrl = libraryView[defaultLibraryView as keyof typeof libraryView];
  const shouldShowLibrary = !privateInstance || authenticatedUser;

  return (
    <header className="header-bar theme-surface flex flex-col" data-uwazi-header>
      <a
        href="#main"
        className="header-bar-skip sr-only focus:not-sr-only absolute top-2 left-2 z-50 rounded-md p-2 ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div className="flex items-center justify-between">
        <MenuLinks />
        <div className="flex items-center gap-2">
          <LanguageDropdown />
          <div className="header-bar-separator h-8 w-px shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-2 p-1">
            {shouldShowLibrary && (
              <I18NLink
                to={libraryUrl}
                className="header-bar-action rounded-md p-3 transition-colors"
              >
                <BookOpenIcon className="h-6 w-6" />
                <Translate className="sr-only">Library</Translate>
              </I18NLink>
            )}
            {authenticatedUser && (
              <I18NLink
                to="/settings/account"
                className="header-bar-action rounded-md p-3 transition-colors"
              >
                <Cog6ToothIcon className="h-6 w-6" />
                <Translate className="sr-only">Settings</Translate>
              </I18NLink>
            )}
            {!authenticatedUser && (
              <I18NLink to="/login" className="header-bar-action rounded-md p-3 transition-colors">
                <KeyIcon className="h-6 w-6" />
                <Translate className="sr-only">Sign in</Translate>
              </I18NLink>
            )}
          </div>
        </div>
      </div>
      <div className="nprogress-container" />
    </header>
  );
};

export { Header };
