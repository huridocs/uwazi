import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { I18NLink, t } from 'app/I18N';
import { Icon } from 'UI';

export class LibraryModeToggleButtons extends Component {
  render() {
    return (
      <div className="list-view-mode">
        { true &&
        <div className="list-view-mode-zoom list-view-buttons-zoom-0 buttons-group">
          <I18NLink to={`library${this.props.searchUrl}`} className="btn btn-default zoom-in">
            <Icon icon="search-plus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom in')}</span>
          </I18NLink>
          <I18NLink to={`library/map${this.props.searchUrl}`} className="btn btn-default zoom-out">
            <Icon icon="search-minus" />
            <span className="tab-link-tooltip">{t('System', 'Zoom out')}</span>
          </I18NLink>
        </div>
        }
        { this.props.showGeolocation &&
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
        }
      </div>
    );
  }
}

LibraryModeToggleButtons.propTypes = {
  searchUrl: PropTypes.string.isRequired,
  showGeolocation: PropTypes.bool.isRequired,
};

export function mapStateToProps(state, props) {
  const params = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  encodeSearch(params);
  return {
    searchUrl: encodeSearch(params),
    showGeolocation: Boolean(state.templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation')))
  };
}

export default connect(mapStateToProps)(LibraryModeToggleButtons);
