import React, { useRef, useState, useCallback, useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import { risonDecodeOrIgnore } from 'app/utils';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Icon } from 'UI';
import { I18NLink, t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { encodeSearch } from '../actions/libraryActions';
import {
  getCurrentSortOption,
  getPropertySortType,
  SearchOptions,
  SortType,
  filterTemplates,
  getSortOptions,
} from '../helpers/sortComponets';

interface SortDropdownOwnProps {
  selectedTemplates: IImmutable<string[]>;
}

const getOptionUrl = (option: SortType, path: string, query: string | null) => {
  const currentQuery = risonDecodeOrIgnore(decodeURIComponent(query || '()'));
  const type = getPropertySortType(option);
  return `${path}${encodeSearch(
    { ...currentQuery, order: type === 'string' ? 'asc' : 'desc', sort: option.value, from: 0 },
    true
  )}`;
};

const mapStateToProps = (state: IStore, ownProps: SortDropdownOwnProps) => {
  let { templates } = state;

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = filterTemplates(state.templates, ownProps.selectedTemplates);
  }

  return {
    templates,
    locale: state.locale,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, 'library'));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

// eslint-disable-next-line max-statements
const SortDropdownComponent = ({ templates, locale }: mappedProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentQuery: SearchOptions = risonDecodeOrIgnore(
    decodeURIComponent(searchParams.get('q') || '()')
  );
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
            const url = getOptionUrl(option, path, searchParams.get('q'));
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
export { container as SortDropdown };
