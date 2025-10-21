import React from 'react';
import { useAtomValue } from 'jotai';
import { BookOpenIcon, Cog6ToothIcon, KeyIcon } from '@heroicons/react/24/outline';
import { I18NLink } from 'app/I18N/I18NLinkV2';
import { Translate } from 'app/I18N';
import { userAtom, settingsAtom } from '../../../atoms';
import { LanguageDropdown } from './LanguageDropdown';
import { MenuLinks } from './MenuLinks';

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
    <header className="bg-white border-b border-gray-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only absolute top-2 left-2 z-50 rounded-md bg-white p-2 ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div className="flex items-center justify-between">
        <MenuLinks />
        <div className="flex items-center gap-2">
          <LanguageDropdown />

          <div className="h-8 w-px bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-2 p-1">
            {shouldShowLibrary && (
              <I18NLink
                to={libraryUrl}
                className="text-gray-900 hover:bg-gray-100 rounded-md transition-colors p-3"
              >
                <BookOpenIcon className="h-6 w-6" />
                <Translate className="sr-only">Library</Translate>
              </I18NLink>
            )}

            {authenticatedUser && (
              <I18NLink
                to="/settings/account"
                className="text-gray-900 hover:bg-gray-100 rounded-md transition-colors p-3"
              >
                <Cog6ToothIcon className="h-6 w-6" />
                <Translate className="sr-only">Settings</Translate>
              </I18NLink>
            )}
            {!authenticatedUser && (
              <I18NLink
                to="/login"
                className="text-gray-900 hover:bg-gray-100 rounded-md transition-colors p-3"
              >
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
