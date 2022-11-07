import React, { useRef, useState, useCallback, useEffect } from 'react';
import { withRouter, WithRouterProps } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import rison from 'rison-node';
import { Icon } from 'UI';
import { I18NLink, t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { encodeSearch } from '../actions/libraryActions';
import {
  getCommonSorts,
  getCurrentSortOption,
  getMetadataSorts,
  getPropertySortType,
  SearchOptions,
  SortType,
  filterTemplates,
} from '../helpers/sortComponets';

interface SortDropdownOwnProps {
  selectedTemplates: IImmutable<string[]>;
}

const getOptionUrl = (location: WithRouterProps['location'], option: SortType, path: string) => {
  const currentQuery = rison.decode(decodeURIComponent(location.query.q || '()'));
  const type = getPropertySortType(option);
  return `${path}${encodeSearch(
    { ...currentQuery, order: type === 'string' ? 'asc' : 'desc', sort: option.value },
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

type mappedProps = ConnectedProps<typeof connector> & WithRouterProps;

const SortDropdownComponent = ({ templates, location, locale }: mappedProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  const currentQuery: SearchOptions = rison.decode(decodeURIComponent(location.query.q || '()'));
  const path = location.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '');
  const sortButtonLink = `${path}${encodeSearch(
    { ...currentQuery, order: currentQuery.order === 'asc' ? 'desc' : 'asc' },
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

  const sortOptions: SortType[] = [
    ...getCommonSorts(currentQuery),
    ...getMetadataSorts(templates),
  ].map(option => ({
    ...option,
    label: t(option.context, option.label, undefined, false),
  }));

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
            const url = getOptionUrl(location, option, path);
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
          {currentQuery.order === 'asc' ? (
            <span style={{ display: 'none' }}>
              {t('System', 'Sort descending', undefined, false)}
            </span>
          ) : (
            <span style={{ display: 'none' }}>
              {t('System', 'Sort ascending', undefined, false)}
            </span>
          )}
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

const container = withRouter(connector(SortDropdownComponent));
export { container as SortDropdown };
