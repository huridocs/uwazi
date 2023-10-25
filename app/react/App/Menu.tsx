import React from 'react';
import { useLocation } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { fromJS } from 'immutable';
import { wrapDispatch } from 'app/Multireducer';
import { NeedAuthorization } from 'app/Auth';
import { I18NLink, I18NMenu, t, Translate } from 'app/I18N';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { showSemanticSearch as showSemanticSearchAction } from 'app/SemanticSearch/actions/actions';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import { libraryViewInfo } from 'app/App/libraryViewInfo';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { IStore } from 'app/istore';
import { searchParamsFromLocationSearch } from 'app/utils/routeHelpers';
import { ILink } from 'app/V2/shared/types';
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

  const getLink = (
    to: string,
    text: string,
    icon: string,
    linkClassName?: string,
    onclick?: (args: any) => any
    // eslint-disable-next-line max-params
  ) => (
    <I18NLink
      to={to}
      onClick={(args: any) => {
        if (onclick) onclick(args);
        hideMobileMenu();
      }}
      className={`menuNav-btn btn btn-default ${linkClassName}`}
      activeclassname="active-link"
      aria-label={t('System', text, null, false)}
    >
      <Icon icon={icon} />
      <span className="tab-link-label">
        <Translate>{text}</Translate>
      </span>
    </I18NLink>
  );

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

  const currentUser = user.toJS();

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
          link={fromJS(link.toJS() as ILink)}
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
          {(!privateInstance || (privateInstance === true && currentUser._id)) && (
            <li className="menuNav-item">
              {getLink(
                libraryUrl(),
                'Library',
                //@ts-ignore
                libraryViewInfo[defaultLibraryView].icon,
                'public-documents',
                setLibraryView
              )}
            </li>
          )}
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-desktop">
              {getLink('/settings/account', 'Settings', 'cog', 'settings-section')}
            </li>
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-mobile">
              {getLink('/settings', 'Settings', 'cog', 'settings-section')}
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
            if (!currentUser._id) {
              return <li className="menuNav-item">{getLink('/login', 'Sign in', 'power-off')}</li>;
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
