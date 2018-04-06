import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { formatMetadata } from '../selectors';
import Metadata from '../components/Metadata';


const FormatMetadata = props => (
  <Metadata metadata={formatMetadata(props, props.entity, props.sortedProperty)} compact={!!props.sortedProperty}/>
);

FormatMetadata.defaultProps = {
  sortedProperty: ''
};

FormatMetadata.propTypes = {
  entity: PropTypes.object.isRequired,
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
