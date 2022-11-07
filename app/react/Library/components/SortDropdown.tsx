import React, { useRef, useState, useCallback, useEffect } from 'react';
import { withRouter, WithRouterProps } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import rison from 'rison-node';
import { I18NLink, t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'UI';
import { propertyTypes } from 'shared/propertyTypes';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTemplateSchema, IStore } from 'app/istore';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { encodeSearch } from '../actions/libraryActions';

type SortType = {
  label: string;
  name: string;
  value: string;
  type: string;
  context?: ObjectIdSchema;
};

type SearchOptions = {
  order?: 'asc' | 'desc';
  sort?: string;
  searchTerm?: string;
};

const getCurrentSortOption = (sortOptions: SortType[], sortOption?: string) => {
  if (!sortOption || sortOption === 'creationDate') {
    const currentOption = sortOptions.find(option => option.value === 'creationDate');
    return currentOption?.label;
  }
  const currentOption = sortOptions.find(option => option.value === sortOption);
  return currentOption?.label;
};

const getPropertySortType = (selected: SortType): string =>
  selected.type === 'text' || selected.type === 'select' ? 'string' : 'number';

const getOptionUrl = (location: WithRouterProps['location'], option: SortType, path: string) => {
  const currentQuery = rison.decode(decodeURIComponent(location.query.q || '()'));
  const type = getPropertySortType(option);
  return `${path}${encodeSearch(
    { ...currentQuery, order: type === 'string' ? 'asc' : 'desc', sort: option.value },
    true
  )}`;
};

const isSortableType = (type: PropertySchema['type']) => {
  switch (type) {
    case propertyTypes.text:
    case propertyTypes.date:
    case propertyTypes.numeric:
    case propertyTypes.select:
      return true;
    default:
      return false;
  }
};

const isSortable = (property: PropertySchema) =>
  property.filter &&
  (isSortableType(property.type) || (property.inherit && isSortableType(property.inherit.type!)));

const getSortString = (property: PropertySchema) =>
  `metadata.${property.name}${property.inherit ? '.inheritedValue' : ''}`;

const getMetadataSorts = (templates: IImmutable<ClientTemplateSchema[]>) =>
  templates.toJS().reduce((sorts: SortType[], template: ClientTemplateSchema) => {
    (template.properties || []).forEach((property: PropertySchema) => {
      if (isSortable(property) && !sorts.find(s => s.name === property.name)) {
        sorts.push({
          label: property.label,
          name: property.name,
          value: getSortString(property),
          type: property.type,
          context: template._id,
        });
      }
    });
    return sorts;
  }, []);

interface SortDropdownOwnProps {
  selectedTemplates: IImmutable<string[]>;
}

const mapStateToProps = (state: IStore, ownProps: SortDropdownOwnProps) => {
  let templates;

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = state.templates.filter(
      i => i !== undefined && ownProps.selectedTemplates.includes(i.get('_id'))
    )! as IImmutable<ClientTemplateSchema[]>;
  }

  return {
    templates: templates || state.templates,
    locale: state.locale,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, 'library'));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & WithRouterProps;

const defaultSorts = [
  { label: 'Title', value: 'title', type: 'text', context: 'System' },
  { label: 'Date added', value: 'creationDate', type: 'number', context: 'System' },
  { label: 'Date modified', value: 'editDate', type: 'number', context: 'System' },
];

const getCommonSorts = (search: SearchOptions) => [
  ...defaultSorts,
  ...(search.searchTerm
    ? [
        {
          label: 'Search relevance',
          value: '_score',
          type: 'number',
          context: 'System',
        },
      ]
    : []),
];

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
