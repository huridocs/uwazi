import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import libraryHelpers from 'app/Library/helpers/libraryFilters';

function getPropertyText(prop, values) {
  const options = values.map(value => prop.options.find(o => o.id === value));
  const labels = options.map(o => o && o.label).filter(l => l);
  return labels.join(', ');
}

function getPropertiesTexts(query, properties) {
  return Object.keys(query.filters).reduce((descriptions, propName) => {
    const { values } = query.filters[propName];
    const property = properties.find(p => p.name === propName);
    if (!values || !property) {
      return descriptions;
    }
    const propText = `${property.label}: ${getPropertyText(property, values)}`;
    return [...descriptions, propText];
  }, []);
}

class SearchDescription extends Component {
  render() {
    const { searchTerm, query, properties } = this.props;
    const descriptions = query && query.filters ? getPropertiesTexts(query, properties) : [];
    const descriptionText = descriptions.length ? ` ${descriptions.join(' - ')}` : '';
    return (
      <span>
        {searchTerm}
        {descriptionText}
      </span>
    );
  }
}

SearchDescription.defaultProps = {
  query: undefined,
};

SearchDescription.propTypes = {
  query: PropTypes.shape({ filters: PropTypes.object, types: PropTypes.array }),
  searchTerm: PropTypes.string.isRequired,
  properties: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function mapStateToProps({ templates }, { query }) {
  const properties =
    query && query.filters
      ? libraryHelpers.URLQueryToState(query, templates.toJS()).properties
      : [];
  return {
    properties,
  };
}

export { SearchDescription, mapStateToProps };
export default connect(mapStateToProps)(SearchDescription);
