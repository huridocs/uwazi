import PropTypes from 'prop-types';
import React from 'react';

import FiltersFromProperties from './FiltersFromProperties';

const RelationshipFilter = ({ onChange, label, property, storeKey, translationContext }) => (
  <ul className="search__filter is-active">
    <li>
      <label>{label}</label>
    </li>
    <li className="wide">
      <FiltersFromProperties
        onChange={onChange}
        properties={property.filters}
        translationContext={translationContext}
        storeKey={storeKey}
        modelPrefix={`.${property.name}`}
      />
    </li>
  </ul>
);

RelationshipFilter.defaultProps = {
  onChange: () => {},
  label: '',
};

RelationshipFilter.propTypes = {
  storeKey: PropTypes.string.isRequired,
  translationContext: PropTypes.string.isRequired,
  property: PropTypes.object,
  onChange: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default RelationshipFilter;
