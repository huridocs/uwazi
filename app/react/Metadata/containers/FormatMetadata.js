import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import selectors from '../selectors';
import Metadata from '../components/Metadata';


const FormatMetadata = props => (
  <Metadata
    metadata={props.additionalMetadata.concat(selectors.formatMetadata(props, props.entity, props.sortedProperty))}
    compact={!!props.sortedProperty}
  />
);

FormatMetadata.defaultProps = {
  sortedProperty: '',
  additionalMetadata: []
};

FormatMetadata.propTypes = {
  entity: PropTypes.shape({
    metadata: PropTypes.object
  }).isRequired,
  additionalMetadata: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string
      }))
    ])
  })),
  sortedProperty: PropTypes.string
};

export function mapStateToProps(state, { entity, sortedProperty }) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    entity,
    sortedProperty
  };
}

export default connect(mapStateToProps)(FormatMetadata);
