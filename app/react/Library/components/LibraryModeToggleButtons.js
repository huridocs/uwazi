import { browserHistory } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { toUrlParams } from 'shared/JSONRequest';

function changeView(type) {
  return () => {
    const path = browserHistory.getCurrentLocation().pathname;
    const { query } = browserHistory.getCurrentLocation();
    query.view = type;

    browserHistory.push(path + toUrlParams(query));
  };
}

function toggleButton(active, type, icon) {
  return (
    <button className={`btn ${active ? 'btn-success' : 'btn-default'}`} onClick={changeView(type)}>
      <i className={`fa fa-${icon}`} />
    </button>
  );
}

export class LibraryModeToggleButtons extends Component {
  render() {
    return (
      <div className="search-list listChart-toggleButtons">
        <div className="buttons-group">
          { toggleButton(this.props.viewMode === 'list', 'list', 'th-large') }
          {/*toggleButton(this.props.viewMode === 'chart', 'chart', 'area-chart') */}
          { toggleButton(this.props.viewMode === 'map', 'map', 'map-marker') }
        </div>
      </div>
    );
  }
}

LibraryModeToggleButtons.defaultProps = {
  viewMode: 'list'
};

LibraryModeToggleButtons.propTypes = {
  viewMode: PropTypes.string
};

export default LibraryModeToggleButtons;
