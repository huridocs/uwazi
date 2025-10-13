import React from 'react';
import { connect } from 'react-redux';
import {
  BookOpenIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { SiteName } from 'app/App/SiteName';
import { I18NLink, I18NMenu, t } from 'app/I18N';
import { DropdownMenu } from 'app/App/DropdownMenu';
import { IStore } from 'app/istore';
import { fromJS } from 'immutable';

interface HeaderProps {
  links: any;
  user: any;
}

const Header = ({ links, user }: HeaderProps) => {
  const navLinks = links
    ?.map((link: any, index: number) => {
      if (link === undefined) {
        return null;
      }
      const type = link.get('type') || 'link';

      if (type === 'link') {
        const url = link.get('url') || '/';
        if (url.startsWith('http')) {
          return (
            <a
              key={link.get('_id')}
              href={url}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {t('Menu', link.get('title'))}
            </a>
          );
        }
        return (
          <I18NLink
            key={link.get('_id')}
            to={url}
            className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            activeclassname="text-blue-600"
          >
            {t('Menu', link.get('title'))}
          </I18NLink>
        );
      }

      // For dropdown menus
      return (
        <DropdownMenu
          link={fromJS(link.toJS())}
          position={index}
          key={`dropdown-${link.get('_id')}`}
          hideMobileMenu={() => undefined}
        />
      );
    })
    ?.filter((v: any) => v !== null)
    ?.toArray();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-2 py-4">
        {/* Left side - Site Name and Navigation */}
        <div className="flex items-center space-x-8">
          <SiteName />

          {/* Dynamic Navigation Menus */}
          <nav className="flex items-center space-x-1">{navLinks}</nav>
        </div>

        {/* Right side - Language Menu and Utility Icons */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <I18NMenu />
          </div>

          {/* Utility Icons */}
          <div className="flex items-center space-x-2">
            <I18NLink
              to="/library"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Library"
            >
              <BookOpenIcon className="h-6 w-6" />
            </I18NLink>

            {user?.get('_id') && (
              <I18NLink
                to="/settings"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Settings"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </I18NLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const mapStateToProps = (state: IStore) => ({
  links: state.settings.collection.get('links'),
  user: state.user,
});

const ConnectedHeader = connect(mapStateToProps)(Header);
export default ConnectedHeader;
