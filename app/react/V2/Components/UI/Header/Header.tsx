import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from '#app/BasicReducer/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { t, Translate } from '#app/I18N/index.js';
import { IStore } from '#app/istore.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { SiteName } from '#app/App/SiteName.js';
import { AppDispatch } from '#app/thunkDispatch.js';
import { useCompactBar } from './useCompactBar.js';
import { buildLibraryUrl } from './buildLibraryUrl.js';
import { settingsAtom, userAtom } from '../../../atoms/index.js';
import { AskBertButton } from '#V2/Components/AIAssistant/AskBertButton.js';
import { RequestStatus } from '../Notifications/RequestStatus.js';
import { LanguageDropdown } from './LanguageDropdown.js';
import { MenuLinks } from './MenuLinks.js';
import { MobileMenuDropdown, type MobileMenuAction } from './MobileMenuDropdown.js';
import { MobileOptionsMenu } from './MobileOptionsMenu.js';
import { useRememberedLibraryUrl } from '#V2/Routes/Library/useRememberedLibraryUrl.js';
import { HeaderIcon, headerChipClass, headerIconButtonClass } from './headerIcons.js';

const mapStateToProps = (state: IStore) => ({
  librarySearch: state.library.search,
  libraryFilters: state.library.filters,
});

const mapDispatchToProps = (dispatch: AppDispatch) =>
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

const splitMobileActions = (entries: MobileMenuAction[], authenticatedUser: boolean) => {
  const shortcutId = authenticatedUser ? 'library' : 'sign-in';
  return {
    barAction: entries.find(entry => entry.id === shortcutId),
    menuActions: entries.filter(entry => entry.id !== shortcutId),
  };
};

const HeaderView = ({ librarySearch, libraryFilters, setSidePanelView }: HeaderReduxProps) => {
  const authenticatedUser = Boolean(useAtomValue(userAtom)?._id);
  const settings = useAtomValue(settingsAtom);
  const { barRef, compact: isMobile } = useCompactBar();
  const location = useLocation();
  const libraryBaseUrl = useMemo(
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
  const libraryUrl = useRememberedLibraryUrl(
    libraryBaseUrl,
    Boolean(settings.features?.featureFlagLibraryV2)
  );
  const shouldShowLibrary = !settings.private || authenticatedUser;
  const { barAction, menuActions } = splitMobileActions(
    buildMobileActions({
      shouldShowLibrary,
      authenticatedUser,
      libraryUrl,
      openLibrary: () => setSidePanelView('library'),
    }),
    authenticatedUser
  );
  const optionsMenu = (
    <MobileOptionsMenu actions={menuActions}>
      <LanguageDropdown />
    </MobileOptionsMenu>
  );

  return (
    <header className="header-bar flex min-h-13 flex-col" data-uwazi-header>
      <a
        href="#main"
        className="header-bar-skip sr-only focus:not-sr-only absolute top-2 left-2 z-50 rounded-md p-2 ring-2"
      >
        <Translate>Skip to main content</Translate>
      </a>
      <div
        ref={barRef}
        className="relative flex h-full min-h-13 flex-1 items-center justify-between gap-4 overflow-visible px-3"
      >
        <div data-testid="header-leading" className="flex min-w-0 flex-1 items-center gap-3">
          {isMobile ? <MobileMenuDropdown links={settings.links ?? []} /> : null}
          <div className="max-w-[12.5rem] shrink-0 overflow-hidden">
            <SiteName
              className="header-bar-brand min-w-0 px-0 py-0 text-base font-semibold"
              textClassName="truncate"
              hideTextWhenLogo
            />
          </div>
          {!isMobile ? <MenuLinks links={settings.links ?? []} endOverlapPx={16} /> : null}
        </div>
        <div className="relative z-40 flex shrink-0 items-center gap-2 overflow-visible">
          <RequestStatus />
          {isMobile ? (
            <>
              <AskBertButton />
              {barAction ? (
                <I18NLink
                  to={barAction.to}
                  onClick={barAction.onClick}
                  className={headerIconButtonClass}
                  activeClassname="header-bar-button-active"
                  aria-label={t('System', barAction.label, null, false)}
                >
                  <HeaderIcon name={barAction.id === 'library' ? 'book-open' : 'log-in'} />
                </I18NLink>
              ) : null}
              {optionsMenu}
            </>
          ) : (
            <div data-testid="header-tools" className="flex items-center gap-2">
              <LanguageDropdown />
              <div className="header-bar-separator h-8 w-px shrink-0" aria-hidden="true" />
              <AskBertButton />
              {shouldShowLibrary && (
                <I18NLink
                  to={libraryUrl}
                  onClick={() => setSidePanelView('library')}
                  className={headerChipClass}
                  activeClassname="header-bar-button-active"
                  aria-label={t('System', 'Library', null, false)}
                >
                  <HeaderIcon name="book-open" />
                  <Translate>Library</Translate>
                </I18NLink>
              )}
              {authenticatedUser ? (
                <I18NLink
                  to="/settings/account"
                  className={headerChipClass}
                  activeClassname="header-bar-button-active"
                  aria-label={t('System', 'Settings', null, false)}
                >
                  <HeaderIcon name="settings" />
                  <Translate>Settings</Translate>
                </I18NLink>
              ) : (
                <I18NLink
                  to="/login"
                  className={headerChipClass}
                  activeClassname="header-bar-button-active"
                >
                  <HeaderIcon name="log-in" />
                  <Translate>Sign in</Translate>
                </I18NLink>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const Header = connector(HeaderView);

export { Header };
