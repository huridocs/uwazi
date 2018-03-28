import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
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

export class ListChartToggleButtons extends Component {
  render() {
    return (
      <div className={`search-list listChart-toggleButtons ${this.props.active === 'chart' ? 'is-chart' : 'is-list'}`}>
        <div className="buttons-group">
          { toggleButton(this.props.active !== 'chart', 'list', 'th-large') }
          { toggleButton(this.props.active === 'chart', 'chart', 'area-chart') }
        </div>
      </div>
    );
  }
}

ListChartToggleButtons.defaultProps = {
  active: 'list'
};

ListChartToggleButtons.propTypes = {
  active: PropTypes.string
};

export default connect()(ListChartToggleButtons);
