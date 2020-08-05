import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { helper as mapHelper } from 'app/Map';
import { HideColumnsDropdown } from './HiddenColumnsDropdown';

export class LibraryModeToggleButtons extends Component {
  render() {
    const {
      numberOfMarkers,
      zoomLevel,
      zoomOut,
      zoomIn,
      showGeolocation,
      searchUrl,
      storeKey,
      showColumnSelector,
    } = this.props;
    const numberOfMarkersText = numberOfMarkers.toString().length > 3 ? '99+' : numberOfMarkers;

    return (
      <div className="list-view-mode">
        {showColumnSelector && (
          <HideColumnsDropdown className="table-view-column-selector" storeKey={storeKey} />
        )}

        {zoomIn && zoomOut && (
          <div className={`list-view-mode-zoom list-view-buttons-zoom-${zoomLevel} buttons-group`}>
            <button className="btn btn-default zoom-out" onClick={zoomOut} type="button">
              <Icon icon="search-minus" />
              <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
            </button>
            <button className="btn btn-default zoom-in" onClick={zoomIn} type="button">
              <Icon icon="search-plus" />
              <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
            </button>
          </div>
        )}

        <div className="list-view-mode-map buttons-group">
          <I18NLink
            to={`library${searchUrl}`}
            className="btn btn-default"
            activeClassName="is-active"
          >
            <Icon icon="th" />
            <span className="tab-link-tooltip">{t('System', 'List view')}</span>
          </I18NLink>
          <I18NLink
            to={`library/table${searchUrl}`}
            className="btn btn-default"
            activeClassName="is-active"
          >
            <Icon icon="align-justify" />
            <span className="tab-link-tooltip">{t('System', 'Table view')}</span>
          </I18NLink>
          {showGeolocation && (
            <I18NLink
              disabled={!numberOfMarkers}
              to={`library/map${searchUrl}`}
              className="btn btn-default"
              activeClassName="is-active"
            >
              <Icon icon="map-marker" />
              <span className="number-of-markers">{numberOfMarkersText}</span>
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
  numberOfMarkers: PropTypes.number.isRequired,
  storeKey: PropTypes.string.isRequired,
  showColumnSelector: PropTypes.bool,
};

LibraryModeToggleButtons.defaultProps = {
  showColumnSelector: false,
  zoomIn: null,
  zoomOut: null,
};

export function mapStateToProps(state, props) {
  const filters = state[props.storeKey].filters.toJS();
  const tableViewColumns = state[props.storeKey].ui.get('tableViewColumns').toJS();
  const params = processFilters(state[props.storeKey].search, filters);
  const { templates } = state;
  const showGeolocation = Boolean(
    templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation'))
  );
  const numberOfMarkers = mapHelper.getMarkers(
    state[props.storeKey].markers.get('rows'),
    state.templates
  ).length;
  return {
    searchUrl: encodeSearch(params),
    showGeolocation,
    numberOfMarkers,
    zoomLevel:
      Object.keys(props).indexOf('zoomLevel') !== -1
        ? props.zoomLevel
        : state[props.storeKey].ui.get('zoomLevel'),
    tableViewColumns,
  };
}

export default connect(mapStateToProps)(LibraryModeToggleButtons);
