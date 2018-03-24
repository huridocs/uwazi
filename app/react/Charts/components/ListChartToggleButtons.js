import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { toUrlParams } from 'shared/JSONRequest';

export class ListChartToggleButtons extends Component {
  changeView(type) {
    const path = browserHistory.getCurrentLocation().pathname;
    const query = browserHistory.getCurrentLocation().query;
    query.view = type;

    browserHistory.push(path + toUrlParams(query));
  }

  render() {
    return (
      <div className={`search-list listChart-toggleButtons ${this.props.active === 'chart' ? 'is-chart' : 'is-list'}`}>
        <div className="buttons-group">
          <button
            className={`btn ${this.props.active !== 'chart' ? 'btn-success' : 'btn-default'}`}
            onClick={this.changeView.bind(this, 'list')}
          >
            <i className="fa fa-th-large" />
          </button>
          <button
            className={`btn ${this.props.active === 'chart' ? 'btn-success' : 'btn-default'}`}
            onClick={this.changeView.bind(this, 'chart')}
          ><i className="fa fa-area-chart" />
          </button>
        </div>
      </div>
    );
  }
}

ListChartToggleButtons.propTypes = {
  active: PropTypes.string
};

export default connect()(ListChartToggleButtons);
