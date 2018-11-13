import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';

export class LibraryModeToggleButtons extends Component {
  render() {
    const numberOfMarkersText = this.props.numberOfMarkers.toString().length > 3 ? '99+' : this.props.numberOfMarkers;
    return (
      <div className="list-view-mode">
        <div className={`list-view-mode-zoom list-view-buttons-zoom-${this.props.zoomLevel} buttons-group`}>
          <button className="btn btn-default zoom-out" onClick={this.props.zoomOut}>
            <Icon icon="search-minus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
          </button>
          <button className="btn btn-default zoom-in" onClick={this.props.zoomIn}>
            <Icon icon="search-plus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
          </button>
        </div>

        { this.props.showGeolocation && (
          <div className="list-view-mode-map buttons-group">
            <I18NLink to={`library${this.props.searchUrl}`} className="btn btn-default" activeClassName="is-active">
              <Icon icon="th" />
              <span className="tab-link-tooltip">{t('System', 'List view')}</span>
            </I18NLink>
            <I18NLink
              disabled={!this.props.numberOfMarkers}
              to={`library/map${this.props.searchUrl}`}
              className="btn btn-default"
              activeClassName="is-active"
            >
              <Icon icon="map-marker" />
              <span className="number-of-markers">{numberOfMarkersText}</span>
              <span className="tab-link-tooltip">{t('System', 'Map view')}</span>
            </I18NLink>
          </div>
        )}
      </div>
    );
  }
}

LibraryModeToggleButtons.propTypes = {
  searchUrl: PropTypes.string.isRequired,
  showGeolocation: PropTypes.bool.isRequired,
  zoomIn: PropTypes.func.isRequired,
  zoomOut: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  numberOfMarkers: PropTypes.number.isRequired,
};

export function mapStateToProps(state, props) {
  const filters = state[props.storeKey].filters.toJS();
  const params = processFilters(state[props.storeKey].search, filters);
  const { templates } = state;
  const showGeolocation = Boolean(templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation')));
  const numberOfMarkers = state[props.storeKey].markers.get('rows').size;
  return {
    searchUrl: encodeSearch(params),
    showGeolocation,
    numberOfMarkers,
    zoomLevel: Object.keys(props).indexOf('zoomLevel') !== -1 ? props.zoomLevel : state[props.storeKey].ui.get('zoomLevel'),
  };
}

export default connect(mapStateToProps)(LibraryModeToggleButtons);
