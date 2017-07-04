import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {parseWithAggregations} from 'app/Library/helpers/libraryFilters';
// import {bindActionCreators} from 'redux';

export class LibraryCharts extends Component {

  render() {
    const fields = parseWithAggregations(this.props.fields.toJS(), this.props.aggregations.toJS())
    .filter((field) => field.type !== 'select' && field.type !== 'multiselect' || field.options.length);
    console.log(fields);
    return (
      <div className="item-group item-group-charts">
        <div className="item">
          Mecanismo
        </div>
        <div className="item">
          Pais
        </div>
        <div className="item">
          Firmantes
        </div>
        <div className="item">
          Tipo
        </div>
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
