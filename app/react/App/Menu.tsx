import React from 'react';
import { useLocation } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
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
import { fromJS } from 'immutable';
import { DropdownMenu, ILink } from './DropdownMenu';

interface MenuProps {
  className: string;
  defaultLibraryView: any;
  onClick: React.MouseEventHandler;
}

const mapStateToProps = (state: IStore) => {
  const { user, settings, library, uploads } = state;
  return {
    user,
    librarySearch: library.search,
    libraryFilters: library.filters,
    uploadsSearch: uploads.search,
    uploadsFilters: uploads.filters,
    uploadsSelectedSorting: uploads.selectedSorting,
    links: settings.collection.get('links'),
    defaultLibraryView: settings.collection.get('defaultLibraryView'),
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
  onClick,
  setSidePanelView,
  showSemanticSearch,
  links = fromJS([]),
  defaultLibraryView = 'cards',
}: mappedProps) => {
  const libraryUrl = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const searchTerm = searchParams.get('searchTerm') || '';
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
            <I18NLink to={url} className="btn menuNav-btn" activeclassname="active-link">
              {t('Menu', link.get('title'))}
            </I18NLink>
          </li>
        );
      }

      return <DropdownMenu link={fromJS(link.toJS() as ILink)} position={index!} key={index} />;
    })
    .filter(v => v !== null)
    .toArray();

  const setLibraryView = () => {
    setSidePanelView('library');
  };
  return (
    <ul className={className}>
      <li className="menuItems" onClick={onClick}>
        <ul className="menuNav-list">{navLinks}</ul>
      </li>
      <I18NMenu />
      <li className="menuActions mobile-menuActions" onClick={onClick}>
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
          <li className="menuNav-item">
            <I18NLink
              to={libraryUrl()}
              onClick={setLibraryView}
              className="menuNav-btn btn btn-default public-documents"
              activeclassname="active-link"
              aria-label={t('System', 'Library', null, false)}
            >
              <Icon
                icon={
                  // @ts-ignore
                  libraryViewInfo[defaultLibraryView].icon
                }
              />
              <span className="tab-link-label">
                <Translate>Library</Translate>
              </span>
            </I18NLink>
          </li>
          <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
            <li className="menuNav-item only-desktop">
              <I18NLink
                to="/settings/account"
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
                to="/settings/"
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
            if (!currentUser._id) {
              return (
                <li className="menuNav-item">
                  <I18NLink
                    to="/login"
                    className="menuNav-btn btn btn-default"
                    aria-label={t('System', 'Sign in', null, false)}
                  >
                    <Icon icon="power-off" />
                    <span className="tab-link-label">
                      <Translate>Sign in</Translate>
                    </span>
                  </I18NLink>
                </li>
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
