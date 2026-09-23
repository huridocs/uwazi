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
import { AskBertButton } from '#V2/Components/AIAssistant/AskBertButton.js';
import { RequestStatus } from '../Notifications/RequestStatus.js';
import { LanguageDropdown } from './LanguageDropdown.js';
import { MenuLinks } from './MenuLinks.js';
import { MobileMenuDropdown, type MobileMenuAction } from './MobileMenuDropdown.js';

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

const buildMobileActions = ({
  shouldShowLibrary,
  authenticatedUser,
  libraryUrl,
  openLibrary,
}: {
  shouldShowLibrary: boolean;
  authenticatedUser: boolean;
  libraryUrl: string;
  openLibrary: () => void;
}): MobileMenuAction[] => {
  const menuActions: MobileMenuAction[] = [];
  if (shouldShowLibrary) {
    menuActions.push({ id: 'library', label: 'Library', to: libraryUrl, onClick: openLibrary });
  }
  if (authenticatedUser) {
    menuActions.push({ id: 'settings', label: 'Settings', to: '/settings/account' });
  } else {
    menuActions.push({ id: 'sign-in', label: 'Sign in', to: '/login' });
  }
  return menuActions;
};

const HeaderView = ({ librarySearch, libraryFilters, setSidePanelView }: HeaderReduxProps) => {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const authenticatedUser = Boolean(useAtomValue(userAtom)?._id);
  const settings = useAtomValue(settingsAtom);
  const isMobile = useIsMobile();
  const location = useLocation();
  const libraryUrl = useMemo(
    () =>
      buildLibraryUrl({
        location,
        librarySearch,
        libraryFilters,
        defaultLibraryView: settings.defaultLibraryView,
        libraryV2: Boolean(settings.features?.featureFlagLibraryV2),
      }),
    [location, librarySearch, libraryFilters, settings.defaultLibraryView, settings.features]
  );
  const shouldShowLibrary = !settings.private || authenticatedUser;
  const headerLinks = settings.links ?? [];
  const mobileActions = buildMobileActions({
    shouldShowLibrary,
    authenticatedUser,
    libraryUrl,
    openLibrary: () => setSidePanelView('library'),
  });

  return (
    <header className="header-bar flex flex-col" data-uwazi-header>
      <a
        href="#main"
        className="header-bar-skip sr-only focus:not-sr-only absolute top-2 left-2 z-50 rounded-md p-2 ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div className="relative flex h-13 items-stretch justify-between gap-4 overflow-visible px-3">
        <div data-testid="header-leading" className="flex min-w-0 flex-1 items-center gap-3">
          {isMobile ? <MobileMenuDropdown links={headerLinks} actions={mobileActions} /> : null}
          <div className="min-w-0 overflow-hidden">
            <SiteName
              className="header-bar-brand min-w-0 px-0 py-0 text-base font-semibold"
              textClassName="truncate"
              hideTextWhenLogo
            />
          </div>
          {!isMobile ? <MenuLinks links={headerLinks} endOverlapPx={16} /> : null}
        </div>
        <div className="relative z-40 flex shrink-0 items-center gap-2 overflow-visible">
          <RequestStatus />
          <LanguageDropdown />
          <div
            className="header-bar-separator hidden h-8 w-px shrink-0 sm:block"
            aria-hidden="true"
          />
          <AskBertButton />
          {!isMobile && shouldShowLibrary && (
            <I18NLink
              to={libraryUrl}
              onClick={() => setSidePanelView('library')}
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-tab font-medium transition-colors"
              activeClassname="header-bar-button-active"
              aria-label={t('System', 'Library', null, false)}
            >
              <BookOpenIcon className="h-4 w-4" />
              <Translate>Library</Translate>
            </I18NLink>
          )}
          {!isMobile && authenticatedUser && (
            <I18NLink
              to="/settings/account"
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-tab font-medium transition-colors"
              activeClassname="header-bar-button-active"
              aria-label={t('System', 'Settings', null, false)}
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <Translate>Settings</Translate>
            </I18NLink>
          )}
          {!isMobile && !authenticatedUser && (
            <I18NLink
              to="/login"
              className="header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-tab font-medium transition-colors"
            >
              <KeyIcon className="h-4 w-4" />
              <Translate>Sign in</Translate>
            </I18NLink>
          )}
          {settings.themeCustomization ? (
            <button
              type="button"
              className="header-bar-icon-button flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              onClick={() => setThemeMode(mode => (mode === 'light' ? 'dark' : 'light'))}
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
