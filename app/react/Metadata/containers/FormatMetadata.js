import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import { metadataSelectors } from '../selectors';
import Metadata from '../components/Metadata';

const removeUneededProps = ({ templates, thesauris, settings, ...rest }) => rest;

const BaseFormatMetadata = ({
  additionalMetadata,
  sortedProperty,
  entity,
  relationships,
  ...props
}) => (
  <Metadata
    metadata={additionalMetadata.concat(
      metadataSelectors.formatMetadata(props, entity, sortedProperty, relationships)
    )}
    compact={!!sortedProperty}
    {...removeUneededProps(props)}
  />
);

BaseFormatMetadata.defaultProps = {
  sortedProperty: '',
  additionalMetadata: [],
  relationships: Immutable.fromJS([]),
};

BaseFormatMetadata.propTypes = {
  entity: PropTypes.shape({
    metadata: PropTypes.object,
  }).isRequired,
  relationships: PropTypes.object,
  additionalMetadata: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(
          PropTypes.shape({
            value: PropTypes.string,
          })
        ),
      ]),
    })
  ),
  sortedProperty: PropTypes.string,
};

export function mapStateToProps(state, { entity, sortedProperty = '' }) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    settings: state.settings.collection,
    entity,
    sortedProperty,
  };
}

export const FormatMetadata = connect(mapStateToProps)(BaseFormatMetadata);
