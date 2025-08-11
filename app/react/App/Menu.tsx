/* eslint-disable react/no-multi-comp */
import React from 'react';
import { useLocation } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { fromJS } from 'immutable';
import { wrapDispatch } from 'app/Multireducer';
import { NeedAuthorization } from 'app/Auth';
import { I18NLink, I18NLinkV2, I18NMenu, t, Translate } from 'app/I18N';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { showSemanticSearch as showSemanticSearchAction } from 'app/SemanticSearch/actions/actions';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import { libraryViewInfo } from 'app/App/libraryViewInfo';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { IStore } from 'app/istore';
import { searchParamsFromLocationSearch } from 'app/utils/routeHelpers';
import { DropdownMenu } from './DropdownMenu';

interface MenuProps {
  className: string;
  defaultLibraryView: any;
  toggleMobileMenu: (visible: boolean) => void;
}

const mapStateToProps = (state: IStore) => {
  const { user, settings, library } = state;
  return {
    user,
    librarySearch: library.search,
    libraryFilters: library.filters,
    links: settings.collection.get('links'),
    defaultLibraryView: settings.collection.get('defaultLibraryView'),
    privateInstance: settings.collection.get('private'),
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      showSemanticSearch: showSemanticSearchAction,
      setSidePanelView: actions.set.bind(null, 'library.sidepanel.view'),
    },
    wrapDispatch(dispatch, 'library')
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & MenuProps;

const MenuComponent = ({
  librarySearch,
  libraryFilters,
  user,
  className,
  toggleMobileMenu,
  setSidePanelView,
  showSemanticSearch,
  links = fromJS([]),
  defaultLibraryView = 'cards',
  privateInstance,
}: mappedProps) => {
  const hideMobileMenu = () => toggleMobileMenu(false);

  const libraryUrl = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    const searchParams = searchParamsFromLocationSearch(location, 'q') || {};
    const searchTerm = searchParams.searchTerm || '';
    const newParams = processFilters(librarySearch, libraryFilters.toJS());
    newParams.searchTerm = searchTerm;

    // @ts-ignore
    return `/${libraryViewInfo[defaultLibraryView].url}/${encodeSearch(newParams)}`;
  };

  const navLinks = links
    .map((link, index) => {
      if (link === undefined) {
        return null;
      }
      const type = link.get('type') || 'link';

      if (type === 'link') {
        const url = link.get('url') || '/';
        if (url.startsWith('http')) {
          return (
            <li key={link.get('_id')} className="menuNav-item">
              <a href={url} className="btn menuNav-btn" target="_blank" rel="noreferrer">
                {t('Menu', link.get('title'))}
              </a>
            </li>
          );
        }
        return (
          <li key={link.get('_id')} className="menuNav-item">
            <I18NLink
              to={url}
              className="btn menuNav-btn"
              activeclassname="active-link"
              onClick={hideMobileMenu}
            >
              {t('Menu', link.get('title'))}
            </I18NLink>
          </li>
        );
      }

      return (
        <DropdownMenu
          link={fromJS(link.toJS())}
          position={index!}
          key={index}
          hideMobileMenu={hideMobileMenu}
        />
      );
    })
    .filter(v => v !== null)
    .toArray();

  const setLibraryView = () => {
    setSidePanelView('library');
  };
  return (
    <ul className={className}>
      <li className="menuItems">
        <ul className="menuNav-list">{navLinks}</ul>
      </li>
      <I18NMenu />
      <li className="menuActions mobile-menuActions">
        <ul className="menuNav-list">
          <FeatureToggleSemanticSearch>
            <li className="menuNav-item semantic-search">
              <button
                type="button"
                onClick={showSemanticSearch}
                className="menuNav-btn btn btn-default"
                aria-label={t('System', 'Semantic search', null, false)}
              >
                <Icon icon="flask" />
                <span className="tab-link-tooltip">
                  <Translate>Semantic search</Translate>
                </span>
              </button>
            </li>
          </FeatureToggleSemanticSearch>
          {(!privateInstance || (privateInstance === true && user?.get('_id'))) && (
            <li className="menuNav-item">
              <I18NLink
                to={libraryUrl()}
                onClick={() => {
                  setLibraryView();
                  hideMobileMenu();
                }}
                className="menuNav-btn btn btn-default public-documents"
                activeclassname="active-link"
                aria-label={t('System', 'Library', null, false)}
              >
                {/* @ts-expect-error */}
                <Icon icon={libraryViewInfo[defaultLibraryView].icon} />
                <span className="tab-link-label">
                  <Translate>Library</Translate>
                </span>
              </I18NLink>
            </li>
          )}
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-desktop">
              <I18NLink
                to="/settings/account"
                onClick={() => {
                  hideMobileMenu();
                }}
                className="menuNav-btn btn btn-default settings-section"
                activeclassname="active-link"
                aria-label={t('System', 'Settings', null, false)}
              >
                <Icon icon="cog" />
                <span className="tab-link-label">
                  <Translate>Settings</Translate>
                </span>
              </I18NLink>
            </li>
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-mobile">
              <I18NLink
                to="/settings"
                onClick={() => {
                  hideMobileMenu();
                }}
                className="menuNav-btn btn btn-default settings-section"
                activeclassname="active-link"
                aria-label={t('System', 'Settings', null, false)}
              >
                <Icon icon="cog" />
                <span className="tab-link-label">
                  <Translate>Settings</Translate>
                </span>
              </I18NLink>
            </li>
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-mobile">
              <a href="/logout" className="menuNav-btn btn btn-default">
                <Icon icon="power-off" />
                <span className="tab-link-label">
                  <Translate>Logout</Translate>
                </span>
              </a>
            </li>
          </NeedAuthorization>
          {(() => {
            if (!user?.get('_id')) {
              return (
                <I18NLinkV2
                  to="/login"
                  className="menuNav-btn btn btn-default menuNav-item"
                  activeClassname="active-link"
                  aria-label={t('System', 'Sign in', null, false)}
                  localized={!privateInstance}
                >
                  <Icon icon="power-off" />
                  <span className="tab-link-label">
                    <Translate>Sign in</Translate>
                  </span>
                </I18NLinkV2>
              );
            }
            return null;
          })()}
        </ul>
      </li>
    </ul>
  );
};

const container = connector(MenuComponent);
export { container as Menu };
