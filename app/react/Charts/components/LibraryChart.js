import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'app/I18N';

import Pie from './Pie';
import Bar from './Bar';

export class LibraryChartComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { type: 'pie' };
    this.maxPieItems = 14;
  }

  assignType(type) {
    this.setState({ type });
  }

  clusterResults(options) {
    return options.reduce((clusteredResults, option, optionIndex) => {
      if (optionIndex < this.maxPieItems) {
        clusteredResults.push(option);
      }

      if (optionIndex === this.maxPieItems) {
        clusteredResults.push({ label: t('System', 'Other'), results: option.results });
      }

      if (optionIndex > this.maxPieItems) {
        clusteredResults[clusteredResults.length - 1].results += option.results;
      }

      return clusteredResults;
    }, []);
  }

  render() {
    if (!this.props.options) {
      return null;
    }

    const chart = this.state.type === 'pie' ?
      <Pie data={this.clusterResults(this.props.options)} /> :
      <Bar data={this.props.options} chartLabel={this.props.label} />;

    return (
      <div className="item item-chart">
        <div>
          <div className="item-chart-type">
            <button
              className={`btn btn-sm ${this.state.type === 'pie' ? 'btn-success' : 'btn-default'}`}
              onClick={this.assignType.bind(this, 'pie')}
            >
              <i className="fa fa-pie-chart" />
            </button>
            <button
              className={`btn btn-sm ${this.state.type === 'bar' ? 'btn-success' : 'btn-default'}`}
              onClick={this.assignType.bind(this, 'bar')}
            >
              <i className="fa fa-bar-chart" />
            </button>
          </div>
          <p>{this.props.label}</p>
          {chart}
        </div>
      </div>
    );
  }
}

LibraryChartComponent.propTypes = {
  options: PropTypes.array,
  label: PropTypes.string
};

export default connect()(LibraryChartComponent);
