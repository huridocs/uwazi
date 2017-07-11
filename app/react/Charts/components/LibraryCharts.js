import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {parseWithAggregations} from 'app/Library/helpers/libraryFilters';

import LibraryChart from './LibraryChart';

export class LibraryCharts extends Component {

  render() {
    if (!this.props.aggregations || !this.props.fields) {
      return null;
    }

    const fields = parseWithAggregations(this.props.fields.toJS(), this.props.aggregations.toJS())
    .filter(field => (field.type === 'select' || field.type === 'multiselect') && field.options.length)
    .map(field => {
      field.options.sort((a, b) => {
        if (a.results === b.results) {
          return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
        }

        return b.results - a.results;
      });
      return field;
    });

    return (
      <div className="item-group item-group-charts">
        {fields.map((field, index) => <LibraryChart key={index} options={field.options} label={field.label} />)}
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
    aggregations: props.storeKey ? state[props.storeKey].aggregations : null,
    fields: props.storeKey ? state[props.storeKey].filters.get('properties') : null
  };
}

export default connect(mapStateToProps)(LibraryCharts);
