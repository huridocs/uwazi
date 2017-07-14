import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {t} from 'app/I18N';

import {parseWithAggregations} from 'app/Library/helpers/libraryFilters';

import LibraryChart from './LibraryChart';

export class LibraryCharts extends Component {

  aggregations(item) {
    let aggregations = this.props.aggregations.toJS();
    let buckets = aggregations.all && aggregations.all.types ? aggregations.all.types.buckets : [];
    let found = buckets.find((agg) => agg.key === item.id);
    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => {
        return result + this.aggregations(_item);
      }, 0);
    }

    return 0;
  }

  conformDocumentTypesToFields() {
    let items = this.props.collection.toJS().filters || [];

    if (!items.length || this.props.storeKey === 'uploads') {
      items = this.props.templates.toJS().map((tpl) => {
        return {id: tpl._id, name: tpl.name};
      });
    }

    if (this.props.storeKey === 'uploads') {
      items.unshift({id: 'missing', name: t('System', 'No type')});
    }

    const fields = [{options: items.map(item => {
      return {label: t(item.id, item.name), results: this.aggregations(item)};
    }), label: t('System', 'Document and entity types')}];

    return fields;
  }

  render() {
    let fields;

    if (this.props.aggregations.size && this.props.fields.size) {
      fields = parseWithAggregations(this.props.fields.toJS(), this.props.aggregations.toJS())
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
    } else {
      fields = this.conformDocumentTypesToFields();
    }

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          <div className="item-group item-group-charts">
            {fields.map((field, index) => <LibraryChart key={index} options={field.options} label={field.label} />)}
          </div>
        </div>
      </div>
    );
  }
}

LibraryCharts.propTypes = {
  aggregations: PropTypes.object,
  fields: PropTypes.object,
  collection: PropTypes.object,
  templates: PropTypes.object,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    aggregations: props.storeKey ? state[props.storeKey].aggregations : null,
    fields: props.storeKey ? state[props.storeKey].filters.get('properties') : null,
    collection: state.settings.collection,
    templates: state.templates
  };
}

export default connect(mapStateToProps)(LibraryCharts);
