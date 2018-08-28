import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { wrapDispatch } from 'app/Multireducer';
import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';

import { processFilters, encodeSearch, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';

export class LibraryModeToggleButtons extends Component {
  render() {
    return (
      <div className="list-view-mode">
        <div className={`list-view-mode-zoom list-view-buttons-zoom-${this.props.zoomLevel} buttons-group`}>
          <button className="btn btn-default zoom-in" onClick={this.props.zoomIn}>
            <Icon icon="search-plus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
          </button>
          <button className="btn btn-default zoom-out" onClick={this.props.zoomOut}>
            <Icon icon="search-minus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
          </button>
        </div>

        { this.props.showGeolocation && (
          <div className="list-view-mode-map buttons-group">
            <I18NLink to={`library${this.props.searchUrl}`} className="btn btn-default" activeClassName="is-active">
              <Icon icon="th" />
              <span className="tab-link-tooltip">{t('System', 'List view')}</span>
            </I18NLink>
            <I18NLink to={`library/map${this.props.searchUrl}`} className="btn btn-default" activeClassName="is-active">
              <Icon icon="map-marker" />
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
};

export function mapStateToProps(state, props) {
  const params = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  encodeSearch(params);
  return {
    searchUrl: encodeSearch(params),
    showGeolocation: Boolean(state.templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation'))),
    zoomLevel: state[props.storeKey].ui.get('zoomLevel'),
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ zoomIn, zoomOut }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryModeToggleButtons);
