import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import {
  BookOpenIcon,
  Cog6ToothIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { actions } from '#app/BasicReducer/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { t, Translate } from '#app/I18N/index.js';
import { IStore } from '#app/istore.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { SiteName } from '#app/App/SiteName.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { buildLibraryUrl } from './buildLibraryUrl.js';
import { settingsAtom, themeModeAtom, userAtom } from '../../../atoms/index.js';
import { RequestStatus } from '../Notifications/RequestStatus.js';
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

const mapStateToProps = (state: IStore) => ({
  librarySearch: state.library.search,
  libraryFilters: state.library.filters,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    { setSidePanelView: actions.set.bind(null, 'library.sidepanel.view') },
    wrapDispatch(dispatch, 'library')
  );

const connector = connect(mapStateToProps, mapDispatchToProps);
type HeaderReduxProps = ConnectedProps<typeof connector>;

const HeaderView = ({ librarySearch, libraryFilters, setSidePanelView }: HeaderReduxProps) => {
  const user = useAtomValue(userAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const authenticatedUser = Boolean(user?._id);
  const settings = useAtomValue(settingsAtom);
  const isMobile = useIsMobile();
  const location = useLocation();

  const { private: privateInstance, defaultLibraryView, themeCustomization } = settings;

  const libraryUrl = useMemo(
    () =>
      buildLibraryUrl({
        location,
        librarySearch,
        libraryFilters,
        defaultLibraryView,
      }),
    [location, librarySearch, libraryFilters, defaultLibraryView]
  );

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
      <div className="flex min-h-13 items-center justify-between gap-4 px-5">
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
          <RequestStatus />
          <LanguageDropdown />
          <div
            className="header-bar-separator hidden h-8 w-px shrink-0 sm:block"
            aria-hidden="true"
          />
          {shouldShowLibrary && (
            <I18NLink
              to={libraryUrl}
              onClick={() => setSidePanelView('library')}
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors"
              activeClassname="header-bar-button-active"
              aria-label={t('System', 'Library', null, false)}
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
              aria-label={t('System', 'Settings', null, false)}
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
    </header>
  );
};

const Header = connector(HeaderView);

export { Header };
