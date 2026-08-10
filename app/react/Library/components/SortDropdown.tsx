import React, { useRef, useState, useCallback, useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import { searchParamsFromLocationSearch } from '#app/utils/routeHelpers.js';
import { useLocation, Location } from 'react-router';
import { Icon } from '#UI/index.js';
import { I18NLink, t } from '#app/I18N/index.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { IStore } from '#app/istore.js';
import { IImmutable } from '#shared/types/Immutable.js';
import { useOnClickOutsideElement } from '#app/utils/useOnClickOutsideElementHook.js';
import { encodeSearch, processFilters } from '../actions/libraryActions.js';

import {
  getCurrentSortOption,
  getPropertySortType,
  SearchOptions,
  SortType,
  filterTemplates,
  getSortOptions,
  selectedTemplatesCount,
} from '../helpers/sortComponets.js';

interface SortDropdownOwnProps {
  selectedTemplates: IImmutable<string[]>;
}

type LibrarySearchQuery = SearchOptions & Record<string, unknown>;

const buildCurrentQuery = (
  search: IStore['library']['search'],
  filters: IStore['library']['filters'],
  location: Pick<Location, 'search'>
): LibrarySearchQuery => {
  const urlQuery = searchParamsFromLocationSearch(location) || {};
  const { treatAs: _treatAs, userSelectedSorting: _userSelectedSorting, ...reduxQuery } =
    processFilters(search, filters.toJS());
  const definedReduxQuery = Object.fromEntries(
    Object.entries(reduxQuery).filter(([, value]) => value !== undefined)
  );

  // Redux reflects the filters currently applied (including home defaults that are not in the URL).
  // URL params still contribute values such as limit that are not stored in search state.
  return { ...urlQuery, ...definedReduxQuery };
};

const getOptionUrl = (option: SortType, path: string, currentQuery: LibrarySearchQuery) => {
  const type = getPropertySortType(option);
  return `${path}${encodeSearch(
    { ...currentQuery, order: type === 'string' ? 'asc' : 'desc', sort: option.value, from: 0 },
    true
  )}`;
};

const mapStateToProps = (state: IStore, ownProps: SortDropdownOwnProps) => {
  let { templates } = state;

  if (selectedTemplatesCount(ownProps.selectedTemplates) > 0) {
    templates = filterTemplates(state.templates, ownProps.selectedTemplates);
  }

  return {
    templates,
    locale: state.locale,
    search: state.library.search,
    filters: state.library.filters,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, 'library'));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

// eslint-disable-next-line max-statements
const SortDropdownComponent = ({ templates, locale, search, filters }: mappedProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const currentQuery = buildCurrentQuery(search, filters, location);
  const path = location.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '');
  const sortButtonLink = `${path}${encodeSearch(
    { ...currentQuery, order: currentQuery.order === 'asc' ? 'desc' : 'asc', from: 0 },
    true
  )}`;

  useEffect(() => {
    setDropdownOpen(false);
  }, [currentQuery.sort]);

  useOnClickOutsideElement<HTMLDivElement>(
    menuRef,
    useCallback(() => {
      setDropdownOpen(false);
    }, [])
  );

  const sortOptions = getSortOptions(currentQuery, templates);

  return (
    <div className="sort-buttons">
      <div className="sort-dropdown" ref={menuRef}>
        <button
          type="button"
          className={`dropdown-button ${dropdownOpen ? 'expanded' : ''}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span>{getCurrentSortOption(sortOptions, currentQuery.sort)}</span>
          <Icon icon={dropdownOpen ? 'caret-up' : 'caret-down'} />
        </button>

        <ul className={`dropdown-menu ${dropdownOpen ? 'expanded' : ''}`}>
          {sortOptions.map(option => {
            const url = getOptionUrl(option, path, currentQuery);
            return (
              <li key={option.value}>
                <I18NLink to={url} href={url}>
                  {option.label}
                </I18NLink>
              </li>
            );
          })}
        </ul>
      </div>

      <I18NLink
        to={sortButtonLink}
        href={sortButtonLink}
        disable={currentQuery.sort === '_score' ? 'true' : undefined}
      >
        <button
          type="button"
          disabled={currentQuery.sort === '_score' ? true : undefined}
          onClick={() => {}}
          className="sorting-toggle"
        >
          <span style={{ display: 'none' }}>
            {currentQuery.order === 'asc'
              ? t('System', 'Sort descending', undefined, false)
              : t('System', 'Sort ascending', undefined, false)}
          </span>
          <Icon
            icon={
              currentQuery.order === 'asc' && currentQuery.sort !== '_score'
                ? 'arrow-up'
                : 'arrow-down'
            }
          />
        </button>
      </I18NLink>
    </div>
  );
};

const container = connector(SortDropdownComponent);
export { container as SortDropdown, buildCurrentQuery };
