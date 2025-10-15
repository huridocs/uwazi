import React from 'react';
import { useAtomValue } from 'jotai';
import { BookOpenIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { SiteName } from 'app/App/SiteName';
import { I18NLink } from 'app/I18N/I18NLinkV2';
import { Translate } from 'app/I18N';
import { userAtom } from '../../../atoms';
import { LanguageDropdown } from './LanguageDropdown';
import { MenuLinks } from './MenuLinks';

// No props needed - using Jotai atoms directly

const Header = () => {
  const user = useAtomValue(userAtom);

  return (
    <header className="bg-white border-b border-gray-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div className="flex items-center justify-between px-2 py-0">
        <div className="flex items-center gap-8">
          <SiteName className="text-xl font-semibold p-2" />
          <MenuLinks />
        </div>

        <div className="flex items-center gap-2">
          <LanguageDropdown />

          <div className="h-8 w-px bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-2 p-1">
            <I18NLink
              to="/library"
              className="text-gray-900 hover:bg-gray-100 rounded-md transition-colors p-3"
              aria-label="Library"
            >
              <BookOpenIcon className="h-6 w-6" />
              <Translate className="sr-only">Library</Translate>
            </I18NLink>

            {user?._id && (
              <I18NLink
                to="/settings"
                className=" text-gray-900 hover:bg-gray-100 rounded-md transition-colors p-3"
                aria-label="Settings"
              >
                <Cog6ToothIcon className="h-6 w-6" />
                <Translate className="sr-only">Settings</Translate>
              </I18NLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
