import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink, t, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { helper as mapHelper } from 'app/Map';
import { showFilters } from 'app/Entities/actions/uiActions';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { HiddenColumnsDropdown } from './HiddenColumnsDropdown';

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
      tableViewMode,
    } = this.props;
    const numberOfMarkersText = numberOfMarkers.toString().length > 3 ? '99+' : numberOfMarkers;

    return (
      <div className="list-view-mode">
        {tableViewMode && (
          <HiddenColumnsDropdown className="table-view-column-selector" storeKey={storeKey} />
        )}

        <div
          className={`list-view-mode-zoom list-view-buttons-zoom-${zoomLevel} buttons-group ${
            tableViewMode ? 'wide-mode' : ''
          }`}
        >
          <button className="btn btn-default zoom-out" onClick={zoomOut} type="button">
            <Icon icon="search-minus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
          </button>
          <button className="btn btn-default zoom-in" onClick={zoomIn} type="button">
            <Icon icon="search-plus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
          </button>
        </div>

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
        {tableViewMode && (
          <button
            type="button"
            className="btn btn-default toggle-button"
            onClick={this.props.showFilters}
          >
            <Icon icon="filter" />
            <span>
              <Translate>Show filters</Translate>
            </span>
          </button>
        )}
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
  tableViewMode: PropTypes.bool,
  showFilters: PropTypes.func,
};

LibraryModeToggleButtons.defaultProps = {
  tableViewMode: false,
  zoomIn: null,
  zoomOut: null,
  showFilters: () => {},
};

export function mapStateToProps(state, props) {
  const filters = state[props.storeKey].filters.toJS();
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
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      showFilters,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryModeToggleButtons);
