import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { createSelector } from 'reselect';

export class LibraryModeToggleButtons extends Component {
  render() {
    const { zoomLevel, zoomOut, zoomIn, showGeolocation, searchUrl, tableViewMode, mapViewMode } =
      this.props;
    return (
      <div className="list-view-mode">
        {!mapViewMode && (
          <div
            className={`list-view-mode-zoom list-view-buttons-zoom-${zoomLevel} buttons-group ${
              tableViewMode ? 'unpinned-mode' : ''
            }`}
          >
            <button
              className="btn btn-default zoom-out"
              onClick={zoomOut}
              type="button"
              aria-label={t('System', 'Zoom out library view', null, false)}
            >
              <Icon icon="search-minus" />
              <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
            </button>
            <button
              className="btn btn-default zoom-in"
              onClick={zoomIn}
              type="button"
              aria-label={t('System', 'Zoom in library view', null, false)}
            >
              <Icon icon="search-plus" />
              <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
            </button>
          </div>
        )}

        <div className="list-view-mode-map buttons-group">
          <I18NLink
            to={`library${searchUrl}`}
            className="btn btn-default"
            activeclassname="is-active"
            aria-label={t('System', 'library list view', null, false)}
          >
            <Icon icon="th" />
            <span className="tab-link-tooltip">{t('System', 'Cards view')}</span>
          </I18NLink>
          <I18NLink
            to={`library/table${searchUrl}`}
            className="btn btn-default"
            activeclassname="is-active"
            aria-label={t('System', 'library table view', null, false)}
          >
            <Icon icon="align-justify" />
            <span className="tab-link-tooltip">{t('System', 'Table view')}</span>
          </I18NLink>
          {showGeolocation && (
            <I18NLink
              to={`library/map${searchUrl}`}
              className="btn btn-default"
              activeclassname="is-active"
              aria-label={t('System', 'library map view', null, false)}
            >
              <Icon icon="map-marker" />
              <span className="tab-link-tooltip">{t('System', 'Map view')}</span>
            </I18NLink>
          )}
        </div>
      </div>
    );
  }
}

LibraryModeToggleButtons.propTypes = {
  searchUrl: PropTypes.string.isRequired,
  showGeolocation: PropTypes.bool.isRequired,
  zoomIn: PropTypes.func,
  zoomOut: PropTypes.func,
  zoomLevel: PropTypes.number.isRequired,
  tableViewMode: PropTypes.bool,
  mapViewMode: PropTypes.bool,
};

LibraryModeToggleButtons.defaultProps = {
  tableViewMode: false,
  mapViewMode: false,
  zoomIn: null,
  zoomOut: null,
};

export const encodedSearch = createSelector(
  state => state.search,
  state => state.filters,
  (search, filters) => {
    const params = processFilters(search, filters.toJS());
    return encodeSearch(params);
  }
);

export function mapStateToProps(state, props) {
  const { templates } = state;
  const showGeolocation = Boolean(
    templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation'))
  );

  return {
    searchUrl: encodedSearch(state.library),
    showGeolocation,
    zoomLevel:
      Object.keys(props).indexOf('zoomLevel') !== -1
        ? props.zoomLevel
        : state.library.ui.get('zoomLevel'),
  };
}
export default connect(mapStateToProps)(LibraryModeToggleButtons);
