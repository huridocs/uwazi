import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {parseWithAggregations} from 'app/Library/helpers/libraryFilters';

import Pie from './Pie';
import Bar from './Bar';

export class LibraryCharts extends Component {

  render() {
    const fields = parseWithAggregations(this.props.fields.toJS(), this.props.aggregations.toJS())
    .filter(field => (field.type === 'select' || field.type === 'multiselect') && field.options.length);

    return (
      <div className="item-group item-group-charts">
        {fields.map((field, index) => {
          return (
            <div key={index} className="item">
              <div>
                {field.label}
                <Pie data={field.options} />
              </div>
              <div>
                {field.label}
                <Bar data={field.options} chartLabel={field.label} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

LibraryCharts.propTypes = {
  aggregations: PropTypes.object,
  fields: PropTypes.object,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    aggregations: state[props.storeKey].aggregations,
    fields: state[props.storeKey].filters.get('properties')
  };
}

export default connect(mapStateToProps)(LibraryCharts);
